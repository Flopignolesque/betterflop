import { loadPrefs, savePrefs, DEFAULT_PREFS } from '../../src/state/prefs';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

test('defaults when empty', () => {
  expect(loadPrefs()).toEqual(DEFAULT_PREFS);
  expect(DEFAULT_PREFS).toMatchObject({ theme: 'auto', compactWeek: false, dept: null, group: null });
});

test('defaults when storage throws', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
  expect(loadPrefs()).toEqual(DEFAULT_PREFS);
});

test('defaults when json is corrupt', () => {
  localStorage.setItem('betterflop:prefs', '{nope');
  expect(loadPrefs()).toEqual(DEFAULT_PREFS);
});

test('savePrefs merges', () => {
  savePrefs({ theme: 'dark' });
  savePrefs({ dept: 'RT', group: 'BUT1|1E' });
  expect(loadPrefs()).toMatchObject({ theme: 'dark', dept: 'RT', group: 'BUT1|1E' });
});

test('savePrefs survives a throwing storage', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  expect(() => savePrefs({ theme: 'light' })).not.toThrow();
});
