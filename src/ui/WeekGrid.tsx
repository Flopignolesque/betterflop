import { layoutDay, type Course } from '../domain/courses';
import { dateOf, formatTime, type DayRef, type IsoWeek } from '../domain/week';
import { CourseCard } from './CourseCard';
import { useSwipe } from './hooks';
import { courseState, minutesOf, sameDay } from './time';

const SHORT: Record<DayRef, string> = { m: 'lun.', tu: 'mar.', w: 'mer.', th: 'jeu.', f: 'ven.', sa: 'sam.', su: 'dim.' };

type Props = {
  week: IsoWeek;
  days: DayRef[];
  courses: Course[];
  compact: boolean;
  showGroups: boolean;
  now: Date;
  onOpen(c: Course): void;
  onSelectDay?: (d: DayRef) => void;
  onSwipeWeek?: (dir: 1 | -1) => void;
};

export function WeekGrid({ week, days, courses, compact, showGroups, now, onOpen, onSelectDay, onSwipeWeek }: Props) {
  const swipe = useSwipe((d) => onSwipeWeek?.(d));
  const first = Math.min(480, ...courses.map((c) => c.start));
  const last = Math.max(1080, ...courses.map((c) => c.end));
  const from = Math.floor(first / 60) * 60;
  const to = Math.ceil(last / 60) * 60;
  const ppm = compact ? 0.75 : 1.1; // pixels per minute
  const hours: number[] = [];
  for (let m = from; m <= to; m += 60) hours.push(m);
  const style = {
    '--days': String(days.length),
    '--h': `${(to - from) * ppm}px`,
    '--hour': `${60 * ppm}px`,
  } as Record<string, string>;
  const top = (m: number) => (m - from) * ppm;

  return (
    <div class={`weekgrid ${compact ? 'compact' : ''}`} style={style} {...swipe}>
      <div />
      {days.map((d) => {
        const date = dateOf(week, d);
        const label = `${SHORT[d]} ${date.getDate()}`;
        return onSelectDay ? (
          <button class={`wg-head btn-ghost ${sameDay(date, now) ? 'today' : ''}`} style="border:none;background:none" onClick={() => onSelectDay(d)}>
            {label}
          </button>
        ) : (
          <div class={`wg-head ${sameDay(date, now) ? 'today' : ''}`}>{label}</div>
        );
      })}
      <div class="wg-hours num" aria-hidden="true">
        {hours.map((m) => (
          <span style={{ top: `${top(m)}px` }}>{compact ? `${m / 60}h` : formatTime(m)}</span>
        ))}
      </div>
      {days.map((d) => {
        const date = dateOf(week, d);
        const isToday = sameDay(date, now);
        const placed = layoutDay(courses.filter((c) => c.day === d));
        const nowMin = minutesOf(now);
        return (
          <div class={`wg-col ${isToday ? 'today' : ''}`}>
            {isToday && nowMin >= from && nowMin <= to && <div class="now-line" style={{ top: `${top(nowMin)}px` }} />}
            {placed.map((c) => (
              <div
                class="wg-item"
                style={{
                  top: `${top(c.start)}px`,
                  height: `${(c.end - c.start) * ppm}px`,
                  left: `${(c.col / c.cols) * 100}%`,
                  width: `${100 / c.cols}%`,
                }}
              >
                <CourseCard course={c} showGroups={showGroups && !compact} state={courseState(c, now)} onOpen={onOpen} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
