import { createContext } from 'preact';
import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import type { Mode } from '../domain/colors';
import { formatRoute, parseRoute, type Route } from '../state/route';

export const ModeContext = createContext<Mode>('light');
export const useMode = () => useContext(ModeContext);

export function navigate(r: Route | string, replace = false): void {
  const hash = typeof r === 'string' ? r : formatRoute(r);
  const url = hash || window.location.pathname + window.location.search;
  if (replace) history.replaceState(null, '', url);
  else history.pushState(null, '', url);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', on);
    window.addEventListener('popstate', on);
    return () => {
      window.removeEventListener('hashchange', on);
      window.removeEventListener('popstate', on);
    };
  }, []);
  return route;
}

export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function isWide(): boolean {
  return window.innerWidth >= 768;
}

export function useIsWide(): boolean {
  const [wide, setWide] = useState(isWide);
  useEffect(() => {
    const on = () => setWide(isWide());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return wide;
}

/** Horizontal swipe detection: dir 1 = swipe left (next), -1 = swipe right (previous). */
export function useSwipe(onSwipe: (dir: 1 | -1) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      start.current = t ? { x: t.clientX, y: t.clientY } : null;
    },
    onTouchEnd(e: TouchEvent) {
      const s = start.current;
      start.current = null;
      const t = e.changedTouches[0];
      if (!s || !t) return;
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        e.stopPropagation();
        onSwipe(dx < 0 ? 1 : -1);
      }
    },
  };
}
