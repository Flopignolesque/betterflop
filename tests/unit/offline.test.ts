import { clearCache, fetchJson, offlineSince, FlopError } from '../../src/api/client';

const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200 });
const PATH = '/fr/api/fetch/scheduledcourses/?dept=RT&week=48&year=2026&work_copy=0';

beforeEach(() => { localStorage.clear(); clearCache(); });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

test('serves the last saved copy when offline and says since when', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 24, 9, 30));
  vi.stubGlobal('fetch', vi.fn(async () => json([{ id: 1 }])));
  await fetchJson(PATH);
  expect(offlineSince(PATH)).toBeNull();

  clearCache(); // new visit
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
  await expect(fetchJson(PATH)).resolves.toEqual([{ id: 1 }]);
  expect(offlineSince(PATH)).toEqual(new Date(2026, 10, 24, 9, 30));
});

test('offline without a saved copy is an error', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
  await expect(fetchJson(PATH)).rejects.toBeInstanceOf(FlopError);
});

test('other endpoints are not persisted', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => json({ x: 1 })));
  await fetchJson('/fr/api/rooms/all/?dept=RT');
  expect(Object.keys(localStorage).filter((k) => k.startsWith('betterflop:cache:'))).toEqual([]);
});

test('a full storage never breaks fetching', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  vi.stubGlobal('fetch', vi.fn(async () => json([1])));
  await expect(fetchJson(PATH)).resolves.toEqual([1]);
  vi.restoreAllMocks();
});
