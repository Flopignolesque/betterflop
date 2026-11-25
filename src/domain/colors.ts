export type Mode = 'light' | 'dark';

export const MODE_TEXT: Record<Mode, string> = { light: '#1c2430', dark: '#e4e8ee' };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

/** Soft, stable colour per module: pastel in light mode, muted in dark mode. */
export function moduleColor(abbrev: string, mode: Mode): { bg: string; fg: string; accent: string } {
  const h = hash(abbrev || '?') % 360;
  return mode === 'light'
    ? { bg: hslToHex(h, 45, 93), fg: MODE_TEXT.light, accent: hslToHex(h, 45, 45) }
    : { bg: hslToHex(h, 22, 21), fg: MODE_TEXT.dark, accent: hslToHex(h, 45, 65) };
}
