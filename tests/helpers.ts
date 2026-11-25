import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function fixture(name: string): string {
  return readFileSync(resolve(__dirname, 'fixtures', name), 'utf8');
}
export function fixtureJson<T = unknown>(name: string): T {
  return JSON.parse(fixture(name)) as T;
}

/** Maps flopEDT URLs (path + query) to fixture files; unknown URLs 404. */
export function fixtureFetch(routes: Record<string, string | (() => Response)>) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    const key = url.pathname + url.search;
    const hit = routes[key] ?? routes[url.pathname];
    if (hit === undefined) return new Response('not found', { status: 404 });
    if (typeof hit === 'function') return hit();
    const body = fixture(hit);
    const type = hit.endsWith('.html') ? 'text/html' : 'application/json';
    return new Response(body, { status: 200, headers: { 'content-type': type } });
  });
}
