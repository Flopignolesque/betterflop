import { render, screen, fireEvent, within } from '@testing-library/preact';
import { App } from '../../src/ui/App';
import { clearCache } from '../../src/api/client';
import { fixtureFetch } from '../helpers';

const routes = {
  '/fr/api/fetch/scheduledcourses/': 'sc-RT-2026-48.json',
  '/fr/api/fetch/constraints/': 'constraints-RT.json',
  '/fr/api/groups/structural/tree/': 'tree-RT.json',
  '/fr/api/groups/transversal/': 'transversal-RT.json',
  '/fr/api/user/tutor/': 'tutors-RT.json',
  '/': 'home.html',
};

beforeEach(() => {
  clearCache();
  localStorage.clear();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 24, 10, 0)); // mardi 24/11/2026 10h00
  Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: false, media: q, addEventListener() {}, removeEventListener() {},
  }));
  window.location.hash = '#/RT/groupe/BUT1/1E/2026-W48';
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test('shows the group courses of the selected day and opens the detail', async () => {
  vi.stubGlobal('fetch', fixtureFetch(routes));
  render(<App />);
  const card = await screen.findByRole('button', { name: /R101/ });
  expect(card).toHaveTextContent('8h00');
  fireEvent.click(card);
  const sheet = await screen.findByRole('dialog');
  expect(within(sheet).getByText('Initiation aux réseaux informatiques')).toBeInTheDocument();
  expect(within(sheet).getByRole('link', { name: 'E104' })).toHaveAttribute('href', '#/RT/salle/E104/2026-W48');
});

test('empty week shows a clear message', async () => {
  vi.stubGlobal('fetch', fixtureFetch({ ...routes, '/fr/api/fetch/scheduledcourses/': () => new Response('[]') }));
  render(<App />);
  expect(await screen.findByText('Pas de cours cette semaine')).toBeInTheDocument();
});

test('network failure shows an error and retry works', async () => {
  let fail = true;
  const ok = fixtureFetch(routes);
  vi.stubGlobal('fetch', vi.fn(async (u: RequestInfo | URL) => {
    if (fail && String(u).includes('scheduledcourses')) throw new TypeError('offline');
    return ok(u);
  }));
  render(<App />);
  expect(await screen.findByText('Impossible de joindre flopEDT')).toBeInTheDocument();
  fail = false;
  fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
  expect(await screen.findByRole('button', { name: /R101/ })).toBeInTheDocument();
});

test('next week button moves the route forward', async () => {
  vi.stubGlobal('fetch', fixtureFetch(routes));
  render(<App />);
  await screen.findByRole('button', { name: /R101/ });
  fireEvent.click(screen.getByRole('button', { name: 'Semaine suivante' }));
  expect(window.location.hash).toBe('#/RT/groupe/BUT1/1E/2026-W49');
});

test('offline: shows the saved week with its date', async () => {
  vi.stubGlobal('fetch', fixtureFetch(routes));
  const { unmount } = render(<App />);
  await screen.findByRole('button', { name: /R101/ });
  unmount();
  clearCache();
  vi.setSystemTime(new Date(2026, 10, 24, 12, 5));
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
  render(<App />);
  expect(await screen.findByRole('button', { name: /R101/ })).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Hors ligne — données du 24/11 à 10h00');
});

test('changing week does not pile up browser history', async () => {
  vi.stubGlobal('fetch', fixtureFetch(routes));
  render(<App />);
  await screen.findByRole('button', { name: /R101/ });
  const before = history.length;
  fireEvent.click(screen.getByRole('button', { name: 'Semaine suivante' }));
  fireEvent.click(screen.getByRole('button', { name: 'Semaine suivante' }));
  expect(history.length).toBe(before);
});

test('coming back to the app reloads the week silently', async () => {
  const f = fixtureFetch(routes);
  vi.stubGlobal('fetch', f);
  render(<App />);
  await screen.findByRole('button', { name: /R101/ });
  const count = () => f.mock.calls.filter((c) => String(c[0]).includes('week=48')).length;
  const before = count();
  vi.setSystemTime(new Date(2026, 10, 24, 10, 10));
  document.dispatchEvent(new Event('visibilitychange'));
  await vi.waitFor(() => expect(count()).toBe(before + 1));
  expect(screen.getByRole('button', { name: /R101/ })).toBeInTheDocument();
});
