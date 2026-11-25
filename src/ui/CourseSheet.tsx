import type { RawTutor } from '../api/types';
import { courseTypeLabel, type Course } from '../domain/courses';
import { formatLongDay, formatTime } from '../domain/week';
import { formatRoute } from '../state/route';
import { tutorName } from '../state/useDeptMeta';
import { Sheet } from './Sheet';

type Props = { course: Course; tutors: Map<string, RawTutor>; onClose(): void };

export function CourseSheet({ course: c, tutors, onClose }: Props) {
  const link = (target: Parameters<typeof formatRoute>[0]) => formatRoute(target);
  const view = (kind: 'tutor' | 'room' | 'module', id: string) =>
    link({ view: 'timetable', dept: c.dept, target: { kind, id }, week: c.week });
  const rooms = c.room ? c.room.split('+') : [];

  return (
    <Sheet title={`${courseTypeLabel(c.type)} · ${c.moduleAbbrev}`} onClose={onClose}>
      <h3 class="detail-title">{c.moduleName || c.moduleAbbrev}</h3>
      <p class="detail-sub num">
        {formatLongDay(c.date)}, {formatTime(c.start)}–{formatTime(c.end)}
      </p>
      <dl class="detail">
        <dt>Prof</dt>
        <dd>
          {c.tutors.length === 0 && '—'}
          {c.tutors.map((t) => (
            <a href={view('tutor', t)} onClick={onClose}>
              {tutorName(tutors.get(t), t)}
            </a>
          ))}
        </dd>
        <dt>Salle</dt>
        <dd>
          {rooms.length === 0 && 'Distanciel'}
          {rooms.map((r) => (
            <a href={view('room', r)} onClick={onClose}>
              {r}
            </a>
          ))}
        </dd>
        <dt>Groupes</dt>
        <dd>
          {c.groups.map((g) => (
            <a href={link({ view: 'timetable', dept: c.dept, target: { kind: 'group', key: g.key }, week: c.week })} onClick={onClose}>
              {g.name}
            </a>
          ))}
        </dd>
        <dt>Module</dt>
        <dd>
          <a href={view('module', c.moduleAbbrev)} onClick={onClose}>
            {c.moduleAbbrev}
          </a>
          <a href={link({ view: 'lister', dept: c.dept, target: { kind: 'module', id: c.moduleAbbrev } })} onClick={onClose}>
            Prochains cours
          </a>
        </dd>
        <dt>Type</dt>
        <dd>
          {c.type}
        </dd>
      </dl>
    </Sheet>
  );
}
