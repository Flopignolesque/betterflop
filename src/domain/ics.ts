import { FLOP_BASE } from '../config';
import { decodeEntities } from './departments';

export type IcsLinks = {
  groups: Map<string, string>;
  tutors: Map<string, string>;
  rooms: Map<string, string>;
};

const LINK_RE = /href="(\/[a-z]{2}\/ics\/[^/"]+\/(structural_group|tutor|room)\/\d+\.ics)"\s*>\s*Copier ce lien - ([^<]+?)\s*</g;

export function parseIcsLinks(html: string): IcsLinks {
  const links: IcsLinks = { groups: new Map(), tutors: new Map(), rooms: new Map() };
  const ambiguous = new Set<string>();
  for (const m of html.matchAll(LINK_RE)) {
    const [, href, kind, rawName] = m;
    const name = decodeEntities(rawName);
    const map = kind === 'structural_group' ? links.groups : kind === 'tutor' ? links.tutors : links.rooms;
    const tag = `${kind}|${name}`;
    if (map.has(name) || ambiguous.has(tag)) {
      map.delete(name);
      ambiguous.add(tag);
      continue;
    }
    map.set(name, FLOP_BASE + href);
  }
  return links;
}
