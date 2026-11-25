import { groupKey, splitGroupKey, type GroupKey } from '../domain/groups';
import { parseWeekKey, weekKey, type IsoWeek } from '../domain/week';

export type Target =
  | { kind: 'group'; key: GroupKey }
  | { kind: 'tutor'; id: string }
  | { kind: 'room'; id: string }
  | { kind: 'module'; id: string };

export type Route =
  | { view: 'home' }
  | { view: 'timetable'; dept: string; target: Target; week: IsoWeek | null }
  | { view: 'lister'; dept: string; target: Target }
  | { view: 'search' }
  | { view: 'settings' };

const SEG: Record<Exclude<Target['kind'], 'group'>, string> = { tutor: 'prof', room: 'salle', module: 'module' };
const KIND: Record<string, Exclude<Target['kind'], 'group'>> = { prof: 'tutor', salle: 'room', module: 'module' };

const enc = encodeURIComponent;
const dec = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

function targetSegments(t: Target): string[] {
  if (t.kind === 'group') {
    const { promo, name } = splitGroupKey(t.key);
    return ['groupe', enc(promo), enc(name)];
  }
  return [SEG[t.kind], enc(t.id)];
}

/** Parses target segments; returns the target and the remaining segments. */
function parseTarget(parts: string[]): [Target, string[]] | null {
  const [kind, ...rest] = parts;
  if (kind === 'groupe') {
    if (rest.length < 2 || !rest[0] || !rest[1]) return null;
    return [{ kind: 'group', key: groupKey(dec(rest[0]), dec(rest[1])) }, rest.slice(2)];
  }
  const k = KIND[kind];
  if (!k || !rest[0]) return null;
  return [{ kind: k, id: dec(rest[0]) }, rest.slice(1)];
}

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts.length === 0) return { view: 'home' };
  if (parts[0] === 'reglages') return { view: 'settings' };
  if (parts[0] === 'chercher') return { view: 'search' };
  const dept = dec(parts[0]);
  if (parts[1] === 'lister') {
    const t = parseTarget(parts.slice(2));
    return t && t[1].length === 0 ? { view: 'lister', dept, target: t[0] } : { view: 'home' };
  }
  const t = parseTarget(parts.slice(1));
  if (!t || t[1].length > 1) return { view: 'home' };
  return { view: 'timetable', dept, target: t[0], week: t[1][0] ? parseWeekKey(t[1][0]) : null };
}

export function formatRoute(r: Route): string {
  switch (r.view) {
    case 'home':
      return '';
    case 'settings':
      return '#/reglages';
    case 'search':
      return '#/chercher';
    case 'lister':
      return '#/' + [enc(r.dept), 'lister', ...targetSegments(r.target)].join('/');
    case 'timetable':
      return '#/' + [enc(r.dept), ...targetSegments(r.target), ...(r.week ? [weekKey(r.week)] : [])].join('/');
  }
}

export function sameTarget(a: Target, b: Target): boolean {
  if (a.kind !== b.kind) return false;
  return a.kind === 'group' ? a.key === (b as typeof a).key : a.id === (b as { id: string }).id;
}
