import { fetchJson, clearCache, FlopError } from '../../src/api/client';
import { getTutors, getRooms, getScheduledCourses } from '../../src/api/flop';
import { fixtureFetch } from '../helpers';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

beforeEach(() => clearCache());
afterEach(() => vi.unstubAllGlobals());

test('dedupes concurrent requests', async () => {
  const f = vi.fn(async () => json([1]));
  vi.stubGlobal('fetch', f);
  const [a, b] = await Promise.all([fetchJson('/x'), fetchJson('/x')]);
  expect(f).toHaveBeenCalledTimes(1);
  expect(a).toEqual([1]);
  expect(b).toEqual([1]);
});

test('caches responses', async () => {
  const f = vi.fn(async () => json({ ok: true }));
  vi.stubGlobal('fetch', f);
  await fetchJson('/y');
  await fetchJson('/y');
  expect(f).toHaveBeenCalledTimes(1);
});

test('network error → FlopError network', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
  await expect(fetchJson('/z')).rejects.toMatchObject({ kind: 'network' });
});

test('http 500 → FlopError http with status', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 500 })));
  const err = await fetchJson('/z').catch((e) => e);
  expect(err).toBeInstanceOf(FlopError);
  expect(err).toMatchObject({ kind: 'http', status: 500 });
});

test('html instead of json → FlopError parse', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('<html></html>', { status: 200 })));
  await expect(fetchJson('/z')).rejects.toMatchObject({ kind: 'parse' });
});

test('errors are not cached', async () => {
  const f = vi.fn()
    .mockImplementationOnce(async () => { throw new TypeError('offline'); })
    .mockImplementationOnce(async () => json([2]));
  vi.stubGlobal('fetch', f);
  await expect(fetchJson('/w')).rejects.toBeInstanceOf(FlopError);
  await expect(fetchJson('/w')).resolves.toEqual([2]);
  expect(f).toHaveBeenCalledTimes(2);
});

test('getTutors strips email', async () => {
  vi.stubGlobal('fetch', vi.fn(async () =>
    json([{ username: 'AB', first_name: 'A', last_name: 'B', email: 'a@b.c', departments: [] }])));
  const tutors = await getTutors('RT');
  expect(tutors).toHaveLength(1);
  expect(tutors.every((t) => !('email' in t))).toBe(true);
});

test('getRooms flattens roomtypes', async () => {
  vi.stubGlobal('fetch', fixtureFetch({ '/fr/api/rooms/all/': 'rooms-RT.json' }));
  const rooms = await getRooms('RT');
  expect(rooms).toContain('E104');
  expect(new Set(rooms).size).toBe(rooms.length);
  expect([...rooms].sort((a, b) => a.localeCompare(b, 'fr'))).toEqual(rooms);
});

test('getScheduledCourses builds url', async () => {
  const f = fixtureFetch({ '/fr/api/fetch/scheduledcourses/': 'sc-RT-2026-48.json' });
  vi.stubGlobal('fetch', f);
  const list = await getScheduledCourses('RT', { year: 2026, week: 48 });
  expect(list).toHaveLength(115);
  expect(String(f.mock.calls[0][0])).toBe(
    'https://flopedt.iut-blagnac.fr/fr/api/fetch/scheduledcourses/?dept=RT&week=48&year=2026&work_copy=0',
  );
});

test('cached data expires after 5 minutes so changes show up', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 24, 10, 0));
  const f = vi.fn(async () => json([1]));
  vi.stubGlobal('fetch', f);
  await fetchJson('/ttl');
  vi.setSystemTime(new Date(2026, 10, 24, 10, 4));
  await fetchJson('/ttl');
  expect(f).toHaveBeenCalledTimes(1);
  vi.setSystemTime(new Date(2026, 10, 24, 10, 6));
  await fetchJson('/ttl');
  expect(f).toHaveBeenCalledTimes(2);
  vi.useRealTimers();
});
