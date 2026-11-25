import {
  addWeeks, dateOf, displayWeekFor, formatDayLabel, formatTime, isoWeekOf, parseWeekKey, weekKey,
} from '../../src/domain/week';

const d = (y: number, m: number, day: number, h = 12) => new Date(y, m - 1, day, h);
const ymd = (x: Date) => [x.getFullYear(), x.getMonth() + 1, x.getDate()];

test('isoWeekOf', () => {
  expect(isoWeekOf(d(2026, 11, 25))).toEqual({ year: 2026, week: 48 });
  expect(isoWeekOf(d(2026, 12, 31))).toEqual({ year: 2026, week: 53 });
  expect(isoWeekOf(d(2027, 1, 4))).toEqual({ year: 2027, week: 1 });
  expect(isoWeekOf(d(2021, 1, 1))).toEqual({ year: 2020, week: 53 });
});

test('addWeeks crosses years', () => {
  expect(addWeeks({ year: 2026, week: 53 }, 1)).toEqual({ year: 2027, week: 1 });
  expect(addWeeks({ year: 2027, week: 1 }, -1)).toEqual({ year: 2026, week: 53 });
  expect(addWeeks({ year: 2026, week: 48 }, -48)).toEqual({ year: 2025, week: 52 });
});

test('dateOf', () => {
  expect(ymd(dateOf({ year: 2026, week: 48 }, 'w'))).toEqual([2026, 11, 25]);
  expect(ymd(dateOf({ year: 2027, week: 1 }, 'm'))).toEqual([2027, 1, 4]);
});

test('displayWeekFor jumps to next week on weekends', () => {
  expect(displayWeekFor(d(2026, 11, 28))).toEqual({ year: 2026, week: 49 });
  expect(displayWeekFor(d(2026, 11, 29))).toEqual({ year: 2026, week: 49 });
  expect(displayWeekFor(d(2026, 11, 27))).toEqual({ year: 2026, week: 48 });
});

test('weekKey round trip and validation', () => {
  expect(weekKey({ year: 2026, week: 8 })).toBe('2026-W08');
  expect(parseWeekKey('2026-W48')).toEqual({ year: 2026, week: 48 });
  expect(parseWeekKey('2026-W53')).toEqual({ year: 2026, week: 53 });
  expect(parseWeekKey('2027-W53')).toBeNull();
  expect(parseWeekKey('2026-W54')).toBeNull();
  expect(parseWeekKey('abc')).toBeNull();
});

test('formatTime and formatDayLabel', () => {
  expect(formatTime(480)).toBe('8h00');
  expect(formatTime(1125)).toBe('18h45');
  expect(formatDayLabel(d(2026, 11, 25))).toBe('mer. 25/11');
});

import { formatLongDay, formatWeekLabel } from '../../src/domain/week';
test('long labels', () => {
  expect(formatLongDay(d(2026, 11, 25))).toBe('Mercredi 25 novembre');
  expect(formatWeekLabel({ year: 2026, week: 48 })).toBe('Semaine 48 · 23–27 nov.');
  expect(formatWeekLabel({ year: 2026, week: 49 })).toBe('Semaine 49 · 30 nov. – 4 déc.');
});
