import type { Course } from '../domain/courses';
import { formatLongDay, formatTime } from '../domain/week';
import { CourseCard } from './CourseCard';
import { useSwipe } from './hooks';
import { courseState, formatGap } from './time';

type Props = {
  date: Date;
  courses: Course[];
  showGroups: boolean;
  now: Date;
  onOpen(c: Course): void;
  onSwipe(dir: 1 | -1): void;
};

export function DayView({ date, courses, showGroups, now, onOpen, onSwipe }: Props) {
  const swipe = useSwipe(onSwipe);
  const sorted = [...courses].sort((a, b) => a.start - b.start || a.end - b.end);

  let lastEnd = -1;
  return (
    <section class="dayview" {...swipe} aria-label={formatLongDay(date)}>
      <h2 class="day-title">{formatLongDay(date)}</h2>
      {sorted.length === 0 && (
        <div class="state">
          <strong>Pas de cours ce jour</strong>
          <span>Glisse ou touche un autre jour.</span>
        </div>
      )}
      {sorted.map((c) => {
        const gap = lastEnd >= 0 ? c.start - lastEnd : 0;
        lastEnd = Math.max(lastEnd, c.end);
        return (
          <>
            {gap >= 30 && <div class="gap-row">Pause {formatGap(gap)}</div>}
            <div class="course-row">
              <div class="course-time num">
                <span>{formatTime(c.start)}</span>
                <span class="end">{formatTime(c.end)}</span>
              </div>
              <CourseCard course={c} showGroups={showGroups} state={courseState(c, now)} onOpen={onOpen} />
            </div>
          </>
        );
      })}
    </section>
  );
}
