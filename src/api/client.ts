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
const stale = new Map<string, Date>();

export function clearCache(): void {
  cache.clear();
  stale.clear();
}

/* ---------- Offline copy (localStorage) ---------- */

const STORE_PREFIX = 'betterflop:cache:';
const MAX_STORED = 40;
const PERSISTED = [
  '/api/fetch/scheduledcourses/',
  '/api/fetch/constraints/',
  '/api/groups/structural/tree/',
  '/api/groups/transversal/',
  '/api/user/tutor/',
];

const persisted = (path: string) => PERSISTED.some((p) => path.includes(p));

type Stored = { savedAt: number; body: string };

function readStored(path: string): Stored | null {
  try {
    const raw = localStorage.getItem(STORE_PREFIX + path);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

function pruneStored(): void {
  const entries: [string, number][] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith(STORE_PREFIX)) continue;
    try {
      entries.push([k, (JSON.parse(localStorage.getItem(k)!) as Stored).savedAt]);
    } catch {
      entries.push([k, 0]);
    }
  }
  entries.sort((a, b) => a[1] - b[1]);
  for (const [k] of entries.slice(0, Math.max(0, entries.length - MAX_STORED + 1))) localStorage.removeItem(k);
}

function writeStored(path: string, body: string): void {
  const value = JSON.stringify({ savedAt: Date.now(), body } satisfies Stored);
  try {
    pruneStored();
    localStorage.setItem(STORE_PREFIX + path, value);
  } catch {
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith(STORE_PREFIX)) localStorage.removeItem(k);
      localStorage.setItem(STORE_PREFIX + path, value);
    } catch {
      /* storage unavailable: no offline copy */
    }
  }
}

/** When the data for `path` came from the offline copy, the time it was saved. */
export function offlineSince(path: string): Date | null {
  return stale.get(path) ?? null;
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

async function requestWithCopy(path: string): Promise<string> {
  try {
    const body = await request(FLOP_BASE + path);
    stale.delete(path);
    return body;
  } catch (e) {
    const copy = e instanceof FlopError && e.kind === 'network' && persisted(path) ? readStored(path) : null;
    if (!copy) throw e;
    stale.set(path, new Date(copy.savedAt));
    return copy.body;
  }
}

function cached<T>(path: string, parse: (body: string) => T): Promise<T> {
  const url = FLOP_BASE + path;
  const hit = cache.get(url);
  if (hit) return hit as Promise<T>;
  const p = requestWithCopy(path).then((body) => {
    const value = parse(body);
    if (persisted(path) && !stale.has(path)) writeStored(path, body);
    return value;
  });
  cache.set(url, p);
  p.then(
    () => stale.has(path) && cache.delete(url), // retry the network next time
    () => cache.delete(url),
  );
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
