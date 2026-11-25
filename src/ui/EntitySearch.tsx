import { useEffect, useMemo, useState } from 'preact/hooks';
import { getModules, getRooms, getTutors } from '../api/flop';
import type { Target } from '../state/route';

type Kind = 'tutor' | 'room' | 'module';
type Item = { target: Target; title: string; sub: string; haystack: string };

const TABS: { kind: Kind; label: string; placeholder: string }[] = [
  { kind: 'tutor', label: 'Profs', placeholder: 'Nom ou initiales du prof' },
  { kind: 'module', label: 'Modules', placeholder: 'Code ou nom du module' },
  { kind: 'room', label: 'Salles', placeholder: 'Nom de la salle' },
];

export const fold = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

async function loadItems(dept: string, kind: Kind): Promise<Item[]> {
  if (kind === 'tutor') {
    const list = await getTutors(dept);
    return list
      .map((t) => {
        const name = `${t.first_name} ${t.last_name}`.trim();
        return { target: { kind, id: t.username } as Target, title: name || t.username, sub: t.username, haystack: fold(`${name} ${t.username}`) };
      })
      .sort((a, b) => a.title.localeCompare(b.title, 'fr'));
  }
  if (kind === 'room') {
    const list = await getRooms(dept);
    return list.map((r) => ({ target: { kind, id: r } as Target, title: r, sub: '', haystack: fold(r) }));
  }
  const list = await getModules(dept);
  const seen = new Set<string>();
  return list
    .filter((m) => !seen.has(m.abbrev) && seen.add(m.abbrev))
    .map((m) => ({ target: { kind, id: m.abbrev } as Target, title: `${m.abbrev} · ${m.name}`, sub: m.promo ?? '', haystack: fold(`${m.abbrev} ${m.name}`) }))
    .sort((a, b) => a.title.localeCompare(b.title, 'fr', { numeric: true }));
}

type Props = { dept: string; onPick(t: Target): void };

export function EntitySearch({ dept, onPick }: Props) {
  const [kind, setKind] = useState<Kind>('tutor');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Item[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setItems(null);
    setFailed(false);
    loadItems(dept, kind).then(
      (x) => alive && setItems(x),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, [dept, kind]);

  const results = useMemo(() => {
    if (!items) return [];
    const words = fold(q).split(/\s+/).filter(Boolean);
    return items.filter((i) => words.every((w) => i.haystack.includes(w))).slice(0, 60);
  }, [items, q]);

  const tab = TABS.find((t) => t.kind === kind)!;

  return (
    <div class="home" style="padding-top:0">
      <div class="tabs" role="tablist">
        {TABS.map((t) => (
          <button role="tab" aria-selected={t.kind === kind} onClick={() => setKind(t.kind)}>
            {t.label}
          </button>
        ))}
      </div>
      <input
        class="search"
        type="search"
        placeholder={tab.placeholder}
        value={q}
        onInput={(e) => setQ((e.target as HTMLInputElement).value)}
        aria-label={tab.placeholder}
      />
      {failed && <p role="alert">Impossible de charger la liste depuis flopEDT.</p>}
      {!items && !failed && <div class="skeleton" />}
      {items && results.length === 0 && <p>Aucun résultat pour « {q} ».</p>}
      <ul class="results">
        {results.map((r) => (
          <li>
            <button onClick={() => onPick(r.target)}>
              <span>{r.title}</span>
              {r.sub && <small>{r.sub}</small>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
