import { useEffect, useMemo, useState } from 'preact/hooks';
import { LISTER_WEEKS } from '../config';
import { filterCourses, type Course, type Filter } from '../domain/courses';
import { departmentsForTarget, upcoming } from '../domain/lister';
import { addWeeks, formatLongDay, isoWeekOf, weekKey, type IsoWeek } from '../domain/week';
import { formatRoute, type Route } from '../state/route';
import type { DeptMeta } from '../state/useDeptMeta';
import { loadWeek } from '../state/useWeekData';
import { CourseCard } from './CourseCard';
import { CourseSheet } from './CourseSheet';
import { useNow } from './hooks';
import { targetTitle } from './TimetableView';

type ListerRoute = Extract<Route, { view: 'lister' }>;
type Props = { route: ListerRoute; meta: DeptMeta };

type Loaded = { key: string; courses: Course[] } | { key: string; error: true };

export function ListerView({ route, meta }: Props) {
  const now = useNow();
  const [weeks, setWeeks] = useState(LISTER_WEEKS);
  const [loaded, setLoaded] = useState<Map<string, Loaded>>(new Map());
  const [attempt, setAttempt] = useState(0);
  const [open, setOpen] = useState<Course | null>(null);

  const start = isoWeekOf(now);
  const depts = departmentsForTarget(route.target, route.dept, [...meta.tutors.values()]);
  const jobs = useMemo(() => {
    const list: { dept: string; week: IsoWeek; key: string }[] = [];
    for (let i = 0; i < weeks; i++) {
      const week = addWeeks(start, i);
      for (const dept of depts) list.push({ dept, week, key: `${dept}/${weekKey(week)}` });
    }
    return list;
  }, [weeks, weekKey(start), depts.join(',')]);

  useEffect(() => {
    let alive = true;
    for (const job of jobs) {
      const prev = loaded.get(job.key);
      if (prev && !('error' in prev)) continue;
      loadWeek(job.dept, job.week).then(
        (courses) => alive && setLoaded((m) => new Map(m).set(job.key, { key: job.key, courses })),
        () => alive && setLoaded((m) => new Map(m).set(job.key, { key: job.key, error: true })),
      );
    }
    return () => {
      alive = false;
    };
  }, [jobs, attempt]);

  const filter: Filter | null =
    route.target.kind === 'group'
      ? meta.index && { kind: 'group', key: route.target.key, index: meta.index }
      : route.target.kind === 'tutor'
        ? { kind: 'tutor', username: route.target.id }
        : route.target.kind === 'room'
          ? { kind: 'room', name: route.target.id }
          : { kind: 'module', abbrev: route.target.id };

  const results = jobs.map((j) => loaded.get(j.key));
  const pending = results.some((r) => !r);
  const failed = results.some((r) => r && 'error' in r);
  const all = results.flatMap((r) => (r && 'courses' in r ? r.courses : []));
  const list = filter ? upcoming(filterCourses(all, filter), now) : [];

  const byDay: { label: string; courses: Course[] }[] = [];
  for (const c of list) {
    const label = formatLongDay(c.date);
    let last = byDay[byDay.length - 1];
    if (!last || last.label !== label) byDay.push((last = { label, courses: [] }));
    last.courses.push(c);
  }

  const title = targetTitle(route.target, meta, all);
  const weekHref = formatRoute({ view: 'timetable', dept: route.dept, target: route.target, week: null });

  return (
    <main class="main">
      <div class="lister">
        <div class="lister-head">
          <h1>Prochains cours de {title}</h1>
        </div>
        <p class="status">
          {pending ? 'Chargement…' : `${list.length} cours sur les ${weeks} prochaines semaines`}
          {' · '}
          <a href={weekHref}>Voir la semaine</a>
        </p>
        {failed && (
          <div class="state" role="alert" style="padding:16px">
            <strong>Certaines semaines n'ont pas pu être chargées</strong>
            <button class="btn" onClick={() => setAttempt((n) => n + 1)}>
              Réessayer
            </button>
          </div>
        )}
        {pending && list.length === 0 && <div class="skeleton" />}
        {!pending && list.length === 0 && !failed && (
          <div class="state">
            <strong>Aucun cours prévu</strong>
            <span>Rien sur les {weeks} prochaines semaines.</span>
          </div>
        )}
        {byDay.map((d) => (
          <section>
            <h2>{d.label}</h2>
            <div class="dayview" style="padding-top:0">
              {d.courses.map((c) => (
                <CourseCard course={c} showGroups showTime onOpen={setOpen} />
              ))}
            </div>
          </section>
        ))}
        <button class="btn" onClick={() => setWeeks((w) => w + LISTER_WEEKS)} disabled={pending}>
          Charger {LISTER_WEEKS} semaines de plus
        </button>
      </div>
      {open && <CourseSheet course={open} tutors={meta.tutors} onClose={() => setOpen(null)} />}
    </main>
  );
}
