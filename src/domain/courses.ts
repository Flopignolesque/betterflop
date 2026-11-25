import type { RawConstraints, RawScheduledCourse } from '../api/types';
import { groupKey, relevantGroupKeys, type GroupIndex, type GroupKey } from './groups';
import { dateOf, type DayRef, type IsoWeek } from './week';

export const DEFAULT_DURATION = 90;

export type Course = {
  id: number;
  dept: string;
  week: IsoWeek;
  day: DayRef;
  date: Date;
  start: number;
  end: number;
  moduleAbbrev: string;
  moduleName: string;
  type: string;
  tutors: string[];
  room: string | null;
  groups: { key: GroupKey; promo: string; name: string; structural: boolean }[];
  graded: boolean;
};

export function normalizeCourses(
  raw: RawScheduledCourse[],
  dept: string,
  week: IsoWeek,
  constraints: RawConstraints,
): Course[] {
  return raw
    .map((r): Course => {
      const duration = constraints[r.course.type]?.duration ?? DEFAULT_DURATION;
      const tutors = [r.tutor, ...r.course.supp_tutor.map((s) => s.username)].filter(
        (t): t is string => !!t,
      );
      return {
        id: r.id,
        dept,
        week,
        day: r.day,
        date: dateOf(week, r.day),
        start: r.start_time,
        end: r.start_time + duration,
        moduleAbbrev: r.course.module?.abbrev ?? '',
        moduleName: r.course.module?.name ?? '',
        type: r.course.type,
        tutors: [...new Set(tutors)],
        room: r.room?.name ?? null,
        groups: r.course.groups.map((g) => ({
          key: groupKey(g.train_prog, g.name),
          promo: g.train_prog,
          name: g.name,
          structural: g.is_structural,
        })),
        graded: r.course.is_graded,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime() || a.start - b.start || a.id - b.id);
}

export type Filter =
  | { kind: 'group'; key: GroupKey; index: GroupIndex }
  | { kind: 'tutor'; username: string }
  | { kind: 'room'; name: string }
  | { kind: 'module'; abbrev: string };

export function roomMatches(courseRoom: string | null, name: string): boolean {
  if (!courseRoom) return false;
  return courseRoom === name || courseRoom.split('+').includes(name);
}

export function filterCourses(courses: Course[], f: Filter): Course[] {
  switch (f.kind) {
    case 'group': {
      const keys = relevantGroupKeys(f.index, f.key);
      return courses.filter((c) => c.groups.some((g) => keys.has(g.key)));
    }
    case 'tutor':
      return courses.filter((c) => c.tutors.includes(f.username));
    case 'room':
      return courses.filter((c) => roomMatches(c.room, f.name));
    case 'module':
      return courses.filter((c) => c.moduleAbbrev === f.abbrev);
  }
}

export type PlacedCourse = Course & { col: number; cols: number };

/** Assigns side-by-side columns to overlapping courses of a single day. */
export function layoutDay(courses: Course[]): PlacedCourse[] {
  const sorted = [...courses].sort((a, b) => a.start - b.start || b.end - a.end);
  const out: PlacedCourse[] = [];
  let cluster: PlacedCourse[] = [];
  let clusterEnd = -1;
  let colEnds: number[] = [];

  const flush = () => {
    for (const c of cluster) c.cols = colEnds.length;
    cluster = [];
    colEnds = [];
  };

  for (const c of sorted) {
    if (c.start >= clusterEnd) {
      flush();
      clusterEnd = -1;
    }
    let col = colEnds.findIndex((end) => end <= c.start);
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(c.end);
    } else {
      colEnds[col] = c.end;
    }
    const placed: PlacedCourse = { ...c, col, cols: 1 };
    cluster.push(placed);
    out.push(placed);
    clusterEnd = Math.max(clusterEnd, c.end);
  }
  flush();
  return out;
}

export function courseTypeLabel(type: string): string {
  if (/^exam/i.test(type)) return 'Examen';
  const m = /^(CM|TD|TP)\d*$/i.exec(type);
  return m ? m[1].toUpperCase() : type;
}

/** Exams and graded sessions, shown in red. */
export function isExam(c: Pick<Course, 'graded' | 'type'>): boolean {
  return c.graded || /^exam/i.test(c.type);
}
