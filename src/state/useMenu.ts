import { useEffect, useState } from 'preact/hooks';
import type { DayMenu, MenuFile } from '../domain/crous';

// menu.json is produced by scripts/fetch-menu.ts in the deploy workflow and served with the site.
let pending: Promise<MenuFile | null> | null = null;

export function clearMenuCache(): void {
  pending = null;
}

export function loadMenu(): Promise<MenuFile | null> {
  if (!pending) {
    pending = fetch(new URL('menu.json', document.baseURI).href)
      .then((r) => (r.ok ? (r.json() as Promise<MenuFile>) : null))
      .then((m) => (m && Array.isArray(m.days) ? m : null))
      .catch(() => null);
  }
  return pending;
}

export function useMenu(enabled: boolean): MenuFile | null {
  const [menu, setMenu] = useState<MenuFile | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    loadMenu().then((m) => alive && setMenu(m));
    return () => {
      alive = false;
    };
  }, [enabled]);
  return enabled ? menu : null;
}

const pad = (n: number) => String(n).padStart(2, '0');
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function menuFor(menu: MenuFile | null, date: Date): DayMenu | null {
  return menu?.days.find((d) => d.date === isoDate(date)) ?? null;
}
