import { render, screen, fireEvent } from '@testing-library/preact';
import { App } from '../../src/ui/App';
import { clearCache } from '../../src/api/client';
import { clearMenuCache } from '../../src/state/useMenu';
import { savePrefs } from '../../src/state/prefs';
import { fixtureFetch } from '../helpers';

const routes = {
  '/fr/api/fetch/scheduledcourses/': 'sc-RT-2026-48.json',
  '/fr/api/fetch/constraints/': 'constraints-RT.json',
  '/fr/api/groups/structural/tree/': 'tree-RT.json',
  '/fr/api/groups/transversal/': 'transversal-RT.json',
  '/fr/api/user/tutor/': 'tutors-RT.json',
  '/menu.json': 'menu.json',
};

beforeEach(() => {
  clearCache();
  clearMenuCache();
  localStorage.clear();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 26, 8, 0)); // jeudi 26/11/2026
  Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener() {}, removeEventListener() {} });
  window.location.hash = '#/RT/groupe/BUT1/1E/2026-W48';
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

test('shows the Resto U lunch of the selected day, details on tap', async () => {
  vi.stubGlobal('fetch', fixtureFetch(routes));
  render(<App />);
  expect(await screen.findByText("Resto U' Blagnac")).toBeInTheDocument();
  expect(screen.getByText('Cordon bleu à la bolognaise')).toBeInTheDocument();
  expect(screen.queryByText('Mousse au chocolat')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /entrées et desserts/ }));
  expect(screen.getByText('Mousse au chocolat')).toBeInTheDocument();
  expect(screen.getByText(/sous réserve de changement/i)).toBeInTheDocument();
});

test('no menu card on a day without menu', async () => {
  vi.stubGlobal('fetch', fixtureFetch(routes));
  render(<App />);
  await screen.findByText("Resto U' Blagnac");
  fireEvent.click(screen.getByRole('tab', { name: /Lun/ }));
  await screen.findByRole('heading', { name: /Lundi 23 novembre/ });
  expect(screen.queryByText("Resto U' Blagnac")).toBeNull();
});

test('missing menu file or the setting turned off → no card', async () => {
  vi.stubGlobal('fetch', fixtureFetch({ ...routes, '/menu.json': () => new Response('nope', { status: 404 }) }));
  const { unmount } = render(<App />);
  await screen.findByRole('button', { name: /SAE12/ });
  expect(screen.queryByText("Resto U' Blagnac")).toBeNull();
  unmount();

  clearMenuCache();
  savePrefs({ showMenu: false });
  vi.stubGlobal('fetch', fixtureFetch(routes));
  render(<App />);
  await screen.findByRole('button', { name: /SAE12/ });
  expect(screen.queryByText("Resto U' Blagnac")).toBeNull();
});
