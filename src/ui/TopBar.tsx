import type { ComponentChildren } from 'preact';
import { formatWeekLabel, type IsoWeek } from '../domain/week';
import { Icon } from './Icon';

type Props = {
  title: string;
  onTitle(): void;
  week: IsoWeek;
  isCurrentWeek: boolean;
  onWeek(delta: number): void;
  onToday(): void;
  children?: ComponentChildren;
};

export function TopBar({ title, onTitle, week, isCurrentWeek, onWeek, onToday, children }: Props) {
  return (
    <header class="topbar">
      <div class="topbar-row">
        <button class="btn target-btn" onClick={onTitle} aria-label={`${title}, changer`}>
          <span>{title}</span>
          <Icon name="down" />
        </button>
        {!isCurrentWeek && (
          <button class="btn" onClick={onToday}>
            Aujourd'hui
          </button>
        )}
      </div>
      <div class="week-nav">
        <button class="btn btn-ghost icon-btn" onClick={() => onWeek(-1)} aria-label="Semaine précédente">
          <Icon name="left" />
        </button>
        <span class="week-label num">{formatWeekLabel(week)}</span>
        <button class="btn btn-ghost icon-btn" onClick={() => onWeek(1)} aria-label="Semaine suivante">
          <Icon name="right" />
        </button>
      </div>
      {children}
    </header>
  );
}
