import { departmentsForTarget, upcoming } from '../../src/domain/lister';
import type { Course } from '../../src/domain/courses';

const mk = (id: number, day: number, start: number, end: number): Course => ({
  id, dept: 'RT', week: { year: 2026, week: 48 }, day: 'tu', date: new Date(2026, 10, day),
  start, end, moduleAbbrev: 'R101', moduleName: '', type: 'TD', tutors: [], room: null, groups: [], graded: false,
});

test('upcoming keeps courses that are not finished yet, sorted', () => {
  const now = new Date(2026, 10, 24, 10, 0);
  const list = upcoming([mk(3, 25, 480, 570), mk(1, 24, 480, 570), mk(2, 24, 480, 720), mk(4, 23, 900, 1000)], now);
  expect(list.map((c) => c.id)).toEqual([2, 3]);
});

test('a tutor is listed across all their departments', () => {
  const tutors = [{ username: 'X', first_name: '', last_name: '', departments: [{ abbrev: 'RT' }, { abbrev: 'GIM' }] }];
  expect(departmentsForTarget({ kind: 'tutor', id: 'X' }, 'RT', tutors)).toEqual(['RT', 'GIM']);
  expect(departmentsForTarget({ kind: 'tutor', id: 'Y' }, 'RT', tutors)).toEqual(['RT']);
  expect(departmentsForTarget({ kind: 'module', id: 'R101' }, 'RT', tutors)).toEqual(['RT']);
});
