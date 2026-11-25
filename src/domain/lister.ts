import type { RawTutor } from '../api/types';
import type { Target } from '../state/route';
import type { Course } from './courses';

const endTime = (c: Course) => {
  const d = new Date(c.date);
  d.setHours(0, c.end, 0, 0);
  return d.getTime();
};

/** Courses not finished at `now`, in chronological order. */
export function upcoming(courses: Course[], now: Date): Course[] {
  const t = now.getTime();
  return courses
    .filter((c) => endTime(c) > t)
    .sort((a, b) => a.date.getTime() - b.date.getTime() || a.start - b.start || a.id - b.id);
}

/** A tutor can teach in several departments; everything else is listed in the current one. */
export function departmentsForTarget(target: Target, dept: string, tutors: RawTutor[]): string[] {
  if (target.kind !== 'tutor') return [dept];
  const t = tutors.find((x) => x.username === target.id);
  const list = t?.departments.map((d) => d.abbrev) ?? [];
  return list.length ? [dept, ...list.filter((d) => d !== dept)] : [dept];
}
