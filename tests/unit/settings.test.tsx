import { render, screen, fireEvent } from '@testing-library/preact';
import { App } from '../../src/ui/App';
import { clearCache } from '../../src/api/client';
import { loadPrefs, savePrefs } from '../../src/state/prefs';
import { fixtureFetch } from '../helpers';

beforeEach(() => {
  clearCache();
  localStorage.clear();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener() {}, removeEventListener() {} });
  vi.stubGlobal('fetch', fixtureFetch({
    '/fr/ics/RT/': 'ics-RT.html',
    '/fr/api/groups/structural/tree/': 'tree-RT.json',
    '/fr/api/groups/transversal/': 'transversal-RT.json',
    '/fr/api/user/tutor/': 'tutors-RT.json',
    '/': 'home.html',
  }));
  savePrefs({ dept: 'RT', group: 'BUT1|1E' });
  window.location.hash = '#/reglages';
});
afterEach(() => vi.unstubAllGlobals());

test('theme choice applies and is remembered', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Sombre' }));
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(loadPrefs().theme).toBe('dark');
  fireEvent.click(screen.getByRole('button', { name: 'Auto' }));
  expect(document.documentElement.dataset.theme).toBeUndefined();
});

test('compact week switch is saved', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('checkbox', { name: /Semaine compacte/ }));
  expect(loadPrefs().compactWeek).toBe(true);
});

test('shows the iCal link of the saved group', async () => {
  render(<App />);
  expect(await screen.findByText('https://flopedt.iut-blagnac.fr/fr/ics/RT/structural_group/538.ics')).toBeInTheDocument();
});
