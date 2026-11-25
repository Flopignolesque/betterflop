import { render, screen, fireEvent } from '@testing-library/preact';
import { App } from '../../src/ui/App';
import { clearCache } from '../../src/api/client';
import { fixtureFetch } from '../helpers';

let f: ReturnType<typeof fixtureFetch>;
beforeEach(() => {
  clearCache();
  localStorage.clear();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 23, 7, 0)); // lundi 23/11/2026
  Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener() {}, removeEventListener() {} });
  f = fixtureFetch({
    '/fr/api/fetch/scheduledcourses/?dept=RT&week=48&year=2026&work_copy=0': 'sc-RT-2026-48.json',
    '/fr/api/fetch/scheduledcourses/': () => new Response('[]'),
    '/fr/api/fetch/constraints/': 'constraints-RT.json',
    '/fr/api/groups/structural/tree/': 'tree-RT.json',
    '/fr/api/groups/transversal/': 'transversal-RT.json',
    '/fr/api/user/tutor/': 'tutors-RT.json',
  });
  vi.stubGlobal('fetch', f);
  window.location.hash = '#/RT/lister/prof/TVAL';
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

const weeksFetched = () => f.mock.calls.map((c) => String(c[0])).filter((u) => u.includes('scheduledcourses'))
  .map((u) => new URL(u).searchParams.get('week'));

test('lists upcoming courses of a tutor and loads more weeks', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: /Prochains cours de/ })).toBeInTheDocument();
  expect((await screen.findAllByRole('button', { name: /R102/ })).length).toBeGreaterThan(0);
  expect(weeksFetched()).toEqual(expect.arrayContaining(['48', '49', '50', '51']));
  fireEvent.click(screen.getByRole('button', { name: 'Charger 4 semaines de plus' }));
  await vi.waitFor(() => expect(weeksFetched()).toEqual(expect.arrayContaining(['52', '53', '1', '2'])));
});
