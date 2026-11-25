import { courseTypeLabel, filterCourses, layoutDay, normalizeCourses, type Course } from '../../src/domain/courses';
import { buildGroupIndex } from '../../src/domain/groups';
import type { RawConstraints, RawGroupNode, RawScheduledCourse } from '../../src/api/types';
import { fixtureJson } from '../helpers';

const W48 = { year: 2026, week: 48 };
const rawRT = fixtureJson<RawScheduledCourse[]>('sc-RT-2026-48.json');
const consRT = fixtureJson<RawConstraints>('constraints-RT.json');
const rt = normalizeCourses(rawRT, 'RT', W48, consRT);
const rtIndex = buildGroupIndex(fixtureJson<RawGroupNode[]>('tree-RT.json'), []);

test('normalizes every course with duration from constraints', () => {
  expect(rt).toHaveLength(115);
  const c = rt.find((x) => x.id === 640980)!;
  expect(c).toMatchObject({ day: 'tu', start: 480, end: 720, moduleAbbrev: 'R101', room: 'E104', tutors: ['SA'], type: 'TP240' });
  expect(c.date.getDate()).toBe(24);
  expect(c.groups[0]).toEqual({ key: 'BUT1|1E', promo: 'BUT1', name: '1E', structural: true });
});

test('sorted by date then start', () => {
  for (let i = 1; i < rt.length; i++) {
    const a = rt[i - 1], b = rt[i];
    expect(a.date.getTime() * 10000 + a.start).toBeLessThanOrEqual(b.date.getTime() * 10000 + b.start);
  }
});

test('unknown type falls back to 90 min; null room and tutor are handled', () => {
  const raw = structuredClone(rawRT[0]);
  raw.course.type = 'ZZZ';
  raw.room = null;
  raw.tutor = null;
  const [c] = normalizeCourses([raw], 'RT', W48, consRT);
  expect(c.end - c.start).toBe(90);
  expect(c.room).toBeNull();
  expect(c.tutors).toEqual([]);
});

test('supplementary tutors are appended', () => {
  const gim = normalizeCourses(fixtureJson('sc-GIM-2026-48.json'), 'GIM', W48, fixtureJson('constraints-GIM.json'));
  const c = gim.find((x) => x.moduleAbbrev === 'DEPT5')!;
  expect(c.tutors).toEqual(['DCO', 'MPH']);
});

test('group filter: own group + ancestors, not siblings', () => {
  const mine = filterCourses(rt, { kind: 'group', key: 'BUT1|1E', index: rtIndex });
  expect(mine.some((c) => c.id === 640980)).toBe(true);
  const allowed = new Set(['BUT1|1E', 'BUT1|1G3', 'BUT1|BUT1']);
  expect(mine.every((c) => c.groups.some((g) => allowed.has(g.key)))).toBe(true);
  expect(mine.some((c) => c.groups.some((g) => g.key === 'BUT1|1G3'))).toBe(true);
  expect(mine.some((c) => c.groups.every((g) => g.key === 'BUT1|1A'))).toBe(false);
});

test('room filter matches combined rooms', () => {
  const c = { ...rt[0], room: 'B112+B113' } as Course;
  expect(filterCourses([c], { kind: 'room', name: 'B113' })).toHaveLength(1);
  expect(filterCourses([c], { kind: 'room', name: 'B112+B113' })).toHaveLength(1);
  expect(filterCourses([c], { kind: 'room', name: 'B11' })).toHaveLength(0);
});

test('tutor and module filters', () => {
  expect(filterCourses(rt, { kind: 'tutor', username: 'SA' }).every((c) => c.tutors.includes('SA'))).toBe(true);
  expect(filterCourses(rt, { kind: 'module', abbrev: 'R101' }).length).toBeGreaterThan(0);
});

test('layoutDay places overlapping courses side by side', () => {
  const base = rt[0];
  const a = { ...base, id: 1, start: 480, end: 570 };
  const b = { ...base, id: 2, start: 540, end: 630 };
  const c = { ...base, id: 3, start: 855, end: 945 };
  const placed = layoutDay([a, b, c]);
  const by = (id: number) => placed.find((p) => p.id === id)!;
  expect([by(1).col, by(1).cols]).toEqual([0, 2]);
  expect([by(2).col, by(2).cols]).toEqual([1, 2]);
  expect([by(3).col, by(3).cols]).toEqual([0, 1]);
});

test('courseTypeLabel', () => {
  expect(courseTypeLabel('TP240')).toBe('TP');
  expect(courseTypeLabel('TD')).toBe('TD');
  expect(courseTypeLabel('CM60')).toBe('CM');
  expect(courseTypeLabel('Examen')).toBe('Examen');
  expect(courseTypeLabel('Exam45')).toBe('Examen');
  expect(courseTypeLabel('ExamTP240')).toBe('Examen');
  expect(courseTypeLabel('X90')).toBe('X90');
});

import { isExam } from '../../src/domain/courses';
test('isExam: graded courses and exam types', () => {
  expect(isExam({ ...rt[0], graded: true, type: 'TD' })).toBe(true);
  expect(isExam({ ...rt[0], graded: false, type: 'Exam45' })).toBe(true);
  expect(isExam({ ...rt[0], graded: false, type: 'ExamTP240' })).toBe(true);
  expect(isExam({ ...rt[0], graded: false, type: 'TP240' })).toBe(false);
});
