import { useEffect, useState } from 'preact/hooks';
import { FlopError, offlineSince } from '../api/client';
import { getConstraints, getScheduledCourses, scheduledCoursesPath } from '../api/flop';
import { normalizeCourses, type Course } from '../domain/courses';
import { addWeeks, weekKey, type IsoWeek } from '../domain/week';

export type WeekData = {
  status: 'loading' | 'ready' | 'error';
  courses: Course[];
  error?: FlopError;
  /** Set when flopEDT was unreachable and a saved copy is shown. */
  offlineSince?: Date | null;
  retry(): void;
};

export async function loadWeek(dept: string, week: IsoWeek): Promise<Course[]> {
  const [raw, constraints] = await Promise.all([
    getScheduledCourses(dept, week),
    getConstraints(dept).catch(() => ({})),
  ]);
  return normalizeCourses(raw, dept, week, constraints);
}

export function useWeekData(dept: string, week: IsoWeek): WeekData {
  const [state, setState] = useState<Omit<WeekData, 'retry'>>({ status: 'loading', courses: [] });
  const [attempt, setAttempt] = useState(0);
  const key = `${dept}/${weekKey(week)}`;

  useEffect(() => {
    let alive = true;
    setState({ status: 'loading', courses: [] });
    loadWeek(dept, week).then(
      (courses) => {
        if (!alive) return;
        setState({ status: 'ready', courses, offlineSince: offlineSince(scheduledCoursesPath(dept, week)) });
        getScheduledCourses(dept, addWeeks(week, 1)).catch(() => {});
      },
      (error) => alive && setState({ status: 'error', courses: [], error: error instanceof FlopError ? error : new FlopError('network') }),
    );
    return () => {
      alive = false;
    };
  }, [key, attempt]);

  // Back in the foreground: reload quietly (memory cache expires after a few minutes).
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'hidden') return;
      loadWeek(dept, week).then(
        (courses) => setState({ status: 'ready', courses, offlineSince: offlineSince(scheduledCoursesPath(dept, week)) }),
        () => {},
      );
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [key]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
