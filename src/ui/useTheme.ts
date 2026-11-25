import { useEffect, useState } from 'preact/hooks';
import type { Mode } from '../domain/colors';
import { loadPrefs, savePrefs, type Theme } from '../state/prefs';

const THEME_COLOR: Record<Mode, string> = { light: '#f3f5f7', dark: '#15191f' };

function systemDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

export function useTheme(): { theme: Theme; mode: Mode; setTheme(t: Theme): void } {
  const [theme, setThemeState] = useState<Theme>(() => loadPrefs().theme);
  const [sysDark, setSysDark] = useState(systemDark);

  useEffect(() => {
    let mq: MediaQueryList | undefined;
    try {
      mq = window.matchMedia('(prefers-color-scheme: dark)');
    } catch {
      return;
    }
    const on = (e: MediaQueryListEvent) => setSysDark(e.matches);
    mq.addEventListener?.('change', on);
    return () => mq?.removeEventListener?.('change', on);
  }, []);

  const mode: Mode = theme === 'auto' ? (sysDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'auto') delete root.dataset.theme;
    else root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[mode]);
  }, [theme, mode]);

  return {
    theme,
    mode,
    setTheme(t) {
      savePrefs({ theme: t });
      setThemeState(t);
    },
  };
}
