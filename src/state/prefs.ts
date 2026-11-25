import type { GroupKey } from '../domain/groups';

export type Theme = 'auto' | 'light' | 'dark';

export type Prefs = {
  theme: Theme;
  compactWeek: boolean;
  dept: string | null;
  group: GroupKey | null;
};

export const DEFAULT_PREFS: Prefs = { theme: 'auto', compactWeek: false, dept: null, group: null };

const KEY = 'betterflop:prefs';

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(p: Partial<Prefs>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...loadPrefs(), ...p }));
  } catch {
    /* storage unavailable: prefs only live for this visit */
  }
}
