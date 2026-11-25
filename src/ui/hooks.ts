import { createContext } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
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
