import { moduleColor } from '../domain/colors';
import { courseTypeLabel, type Course } from '../domain/courses';
import { formatTime } from '../domain/week';
import { useMode } from './hooks';

type Props = {
  course: Course;
  showGroups: boolean;
  showTime?: boolean;
  state?: 'now' | 'past' | null;
  onOpen(c: Course): void;
};

export const groupsLabel = (c: Course) => c.groups.map((g) => g.name).join(', ');

export function CourseCard({ course: c, showGroups, showTime, state, onOpen }: Props) {
  const col = moduleColor(c.moduleAbbrev, useMode());
  const style = { '--card-bg': col.bg, '--card-fg': col.fg, '--card-accent': col.accent } as Record<string, string>;
  return (
    <button class={`card ${state ?? ''}`} style={style} onClick={() => onOpen(c)}>
      {!showTime && (
        <span class="visually-hidden">
          {formatTime(c.start)} à {formatTime(c.end)} :{' '}
        </span>
      )}
      <span class="mod">
        <span class="abbr">{c.moduleAbbrev}</span>
        <span class="name">{c.moduleName}</span>
        {c.graded && <span class="badge">Évalué</span>}
      </span>
      <span class="meta">
        {showTime && <span class="num">{formatTime(c.start)}–{formatTime(c.end)}</span>}
        <span>{courseTypeLabel(c.type)}</span>
        <span>{c.room ?? 'Distanciel'}</span>
        <span class="tut">{c.tutors.join(', ') || '—'}</span>
        {showGroups && <span>{groupsLabel(c)}</span>}
      </span>
    </button>
  );
}
