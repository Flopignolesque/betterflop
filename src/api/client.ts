import { FLOP_BASE } from '../config';

export type FlopErrorKind = 'network' | 'http' | 'parse';

export class FlopError extends Error {
  constructor(
    public kind: FlopErrorKind,
    public status?: number,
  ) {
    super(`flopEDT ${kind} error${status ? ` (${status})` : ''}`);
    this.name = 'FlopError';
  }
}

const cache = new Map<string, Promise<unknown>>();

export function clearCache(): void {
  cache.clear();
}

async function request(url: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new FlopError('network');
  }
  if (!res.ok) throw new FlopError('http', res.status);
  try {
    return await res.text();
  } catch {
    throw new FlopError('network');
  }
}

function cached<T>(path: string, parse: (body: string) => T): Promise<T> {
  const url = FLOP_BASE + path;
  const hit = cache.get(url);
  if (hit) return hit as Promise<T>;
  const p = request(url).then(parse);
  cache.set(url, p);
  p.catch(() => cache.delete(url));
  return p;
}

export function fetchJson<T>(path: string): Promise<T> {
  return cached(path, (body) => {
    try {
      return JSON.parse(body) as T;
    } catch {
      throw new FlopError('parse');
    }
  });
}

export function fetchText(path: string): Promise<string> {
  return cached(path, (body) => body);
}
