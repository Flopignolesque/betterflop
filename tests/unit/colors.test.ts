import { moduleColor, MODE_TEXT } from '../../src/domain/colors';
import { fixtureJson } from '../helpers';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

test('stable for the same module', () => {
  expect(moduleColor('R101', 'light')).toEqual(moduleColor('R101', 'light'));
});

test('different modules get different hues', () => {
  expect(moduleColor('R101', 'light').bg).not.toBe(moduleColor('R102', 'light').bg);
});

test('readable text on every module background, both modes', () => {
  const mods = fixtureJson<{ abbrev: string }[]>('modules-RT.json').slice(0, 50);
  for (const mode of ['light', 'dark'] as const) {
    for (const m of mods) {
      const c = moduleColor(m.abbrev, mode);
      expect(c.fg).toBe(MODE_TEXT[mode]);
      expect(contrast(c.fg, c.bg)).toBeGreaterThanOrEqual(4.5);
      expect(c.bg).toMatch(/^#[0-9a-f]{6}$/);
    }
  }
});
