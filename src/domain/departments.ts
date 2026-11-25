import { getHomeHtml } from '../api/flop';
import { FALLBACK_DEPARTMENTS } from '../config';

export type Department = { code: string; name: string };

const DEPT_RE = /goTo\('\/[a-z]{2}\/edt\/([^/']+)\/'\);?"\s*>\s*([^<]+?)\s*</g;

export function parseDepartments(html: string): Department[] {
  const out: Department[] = [];
  for (const m of html.matchAll(DEPT_RE)) {
    if (!out.some((d) => d.code === m[1])) out.push({ code: m[1], name: decodeEntities(m[2]) });
  }
  return out;
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export async function loadDepartments(): Promise<Department[]> {
  try {
    const list = parseDepartments(await getHomeHtml());
    return list.length ? list : FALLBACK_DEPARTMENTS;
  } catch {
    return FALLBACK_DEPARTMENTS;
  }
}
