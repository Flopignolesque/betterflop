import { formatRoute, parseRoute } from '../../src/state/route';

const cases = [
  '#/RT/groupe/BUT1/1E/2026-W48',
  '#/RT/groupe/BUT1/1E',
  '#/RT/prof/TVAL',
  '#/RT/salle/E104/2026-W48',
  '#/RT/module/R101',
  '#/RT/lister/prof/TVAL',
  '#/RT/lister/module/R101',
  '#/reglages',
];

test.each(cases)('round trip %s', (h) => {
  expect(formatRoute(parseRoute(h))).toBe(h);
});

test('parses group route', () => {
  expect(parseRoute('#/RT/groupe/BUT1/1E/2026-W48')).toEqual({
    view: 'timetable', dept: 'RT', target: { kind: 'group', key: 'BUT1|1E' }, week: { year: 2026, week: 48 },
  });
});

test('combined room names survive the round trip', () => {
  const r = { view: 'timetable', dept: 'GIM', target: { kind: 'room', id: 'B112+B113' }, week: null } as const;
  expect(parseRoute(formatRoute(r))).toEqual(r);
});

test('invalid hashes go home', () => {
  expect(parseRoute('')).toEqual({ view: 'home' });
  expect(parseRoute('#/n/importe/quoi')).toEqual({ view: 'home' });
  expect(parseRoute('#/RT/groupe/BUT1')).toEqual({ view: 'home' });
});

test('invalid week is ignored', () => {
  expect(parseRoute('#/RT/prof/TVAL/2026-W99')).toMatchObject({ view: 'timetable', week: null });
});
