import { dateOf, type DayRef, type IsoWeek } from '../domain/week';
import { useSwipe } from './hooks';
import { sameDay } from './time';

const SHORT: Record<DayRef, string> = { m: 'Lun', tu: 'Mar', w: 'Mer', th: 'Jeu', f: 'Ven', sa: 'Sam', su: 'Dim' };

type Props = {
  week: IsoWeek;
  days: DayRef[];
  selected: DayRef;
  busy: Set<DayRef>;
  now: Date;
  onSelect(d: DayRef): void;
  onSwipeWeek(dir: 1 | -1): void;
};

export function DayStrip({ week, days, selected, busy, now, onSelect, onSwipeWeek }: Props) {
  const swipe = useSwipe(onSwipeWeek);
  return (
    <div class="daystrip" role="tablist" aria-label="Jours de la semaine" {...swipe}>
      {days.map((d) => {
        const date = dateOf(week, d);
        return (
          <button
            role="tab"
            aria-selected={d === selected}
            class={`day-chip ${sameDay(date, now) ? 'today' : ''}`}
            onClick={() => onSelect(d)}
            aria-label={`${SHORT[d]} ${date.getDate()}`}
          >
            <span class="d">{SHORT[d]}</span>
            <span class="n num">{date.getDate()}</span>
            <span class={`dot ${busy.has(d) ? '' : 'empty'}`} />
          </button>
        );
      })}
    </div>
  );
}
