import { render, screen, fireEvent } from '@testing-library/preact';
import { GroupPicker } from '../../src/ui/GroupPicker';
import { EntitySearch } from '../../src/ui/EntitySearch';
import { App } from '../../src/ui/App';
import { clearCache } from '../../src/api/client';
import { savePrefs } from '../../src/state/prefs';
import { fixtureFetch } from '../helpers';

const routes = {
  '/': 'home.html',
  '/fr/api/groups/structural/tree/?dept=RT': 'tree-RT.json',
  '/fr/api/groups/structural/tree/?dept=INFO': 'tree-INFO.json',
  '/fr/api/groups/transversal/': 'transversal-RT.json',
  '/fr/api/user/tutor/': 'tutors-RT.json',
  '/fr/api/rooms/all/': 'rooms-RT.json',
  '/fr/edt/RT/fetch_all_modules_with_desc': 'modules-RT.json',
};

beforeEach(() => {
  clearCache();
  localStorage.clear();
  window.location.hash = '';
  Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener() {}, removeEventListener() {} });
  vi.stubGlobal('fetch', fixtureFetch(routes));
});
afterEach(() => vi.unstubAllGlobals());

const click = async (name: string | RegExp) => fireEvent.click(await screen.findByRole('button', { name }));

test('RT → BUT1 → 1G3 → 1E', async () => {
  const onPick = vi.fn();
  render(<GroupPicker onPick={onPick} />);
  await click(/Réseaux et Télécommunications/);
  await click('BUT1');
  await click('1G3');
  await click('1E');
  expect(onPick).toHaveBeenCalledWith('RT', 'BUT1|1E');
});

test('INFO BUT2 needs two levels before 1A', async () => {
  const onPick = vi.fn();
  render(<GroupPicker onPick={onPick} />);
  await click(/Informatique/);
  await click('BUT2');
  await click('12');
  await click('1');
  await click('1A');
  expect(onPick).toHaveBeenCalledWith('INFO', 'BUT2|1A');
});

test('a TD can be chosen as a whole', async () => {
  const onPick = vi.fn();
  render(<GroupPicker onPick={onPick} />);
  await click(/Réseaux et Télécommunications/);
  await click('BUT1');
  await click('1G3');
  await click('Tout le groupe 1G3');
  expect(onPick).toHaveBeenCalledWith('RT', 'BUT1|1G3');
});

test('a saved group that no longer exists opens the picker', async () => {
  savePrefs({ dept: 'RT', group: 'BUT9|ZZ' });
  render(<App />);
  expect(await screen.findByRole('button', { name: 'BUT1' })).toBeInTheDocument();
  expect(window.location.hash).toBe('');
});

test('a saved group redirects to its timetable', async () => {
  savePrefs({ dept: 'RT', group: 'BUT1|1E' });
  render(<App />);
  await vi.waitFor(() => expect(window.location.hash).toBe('#/RT/groupe/BUT1/1E'));
});

test.each([
  ['Profs', 'aupeix', /AUPEIX/],
  ['Modules', 'reseaux', /R101/],
  ['Salles', 'e104', /^E104$/],
])('search %s "%s"', async (tab, q, expected) => {
  const onPick = vi.fn();
  render(<EntitySearch dept="RT" onPick={onPick} />);
  fireEvent.click(screen.getByRole('tab', { name: tab }));
  fireEvent.input(screen.getByRole('searchbox'), { target: { value: q } });
  const hit = await screen.findByRole('button', { name: expected });
  fireEvent.click(hit);
  expect(onPick).toHaveBeenCalled();
});
