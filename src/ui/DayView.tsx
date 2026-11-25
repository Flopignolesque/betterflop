import { useRef } from 'preact/hooks';
import type { Course } from '../domain/courses';
import { formatLongDay, formatTime } from '../domain/week';
import { CourseCard } from './CourseCard';
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
  const start = useRef<{ x: number; y: number } | null>(null);
  const sorted = [...courses].sort((a, b) => a.start - b.start || a.end - b.end);

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: TouchEvent) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) onSwipe(dx < 0 ? 1 : -1);
  };

  let lastEnd = -1;
  return (
    <section class="dayview" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} aria-label={formatLongDay(date)}>
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
