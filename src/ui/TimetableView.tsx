import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { filterCourses, type Course, type Filter } from '../domain/courses';
import { splitGroupKey } from '../domain/groups';
import {
  addWeeks, dateOf, DAY_REFS, displayWeekFor, isoWeekOf, sameWeek, weekKey, type DayRef, type IsoWeek,
} from '../domain/week';
import { formatRoute, type Route, type Target } from '../state/route';
import { tutorName, type DeptMeta } from '../state/useDeptMeta';
import { useWeekData } from '../state/useWeekData';
import { menuFor, useMenu } from '../state/useMenu';
import { MenuCard } from './MenuCard';
import { CourseSheet } from './CourseSheet';
import { DayStrip } from './DayStrip';
import { DayView } from './DayView';
import { navigate, useIsWide, useNow } from './hooks';
import { TopBar } from './TopBar';
import { WeekGrid } from './WeekGrid';

type TimetableRoute = Extract<Route, { view: 'timetable' }>;

type Props = {
  route: TimetableRoute;
  meta: DeptMeta;
  compact: boolean;
  showMenu: boolean;
  onChangeTarget(): void;
};

const WEEKDAYS: DayRef[] = ['m', 'tu', 'w', 'th', 'f'];

const pad = (n: number) => String(n).padStart(2, '0');
export const formatStamp = (d: Date) =>
  `${pad(d.getDate())}/${pad(d.getMonth() + 1)} à ${d.getHours()}h${pad(d.getMinutes())}`;

export function targetTitle(t: Target, meta: DeptMeta, courses: Course[] = []): string {
  switch (t.kind) {
    case 'group': {
      const node = meta.index?.nodes.get(t.key);
      const { promo, name } = splitGroupKey(t.key);
      return node && node.depth > 0 ? `${node.promoLabel} · ${node.name}` : node?.promoLabel ?? `${promo} · ${name}`;
    }
    case 'tutor':
      return tutorName(meta.tutors.get(t.id), t.id);
    case 'room':
      return `Salle ${t.id}`;
    case 'module': {
      const name = courses.find((c) => c.moduleAbbrev === t.id)?.moduleName;
      return name ? `${t.id} · ${name}` : t.id;
    }
  }
}

function toFilter(t: Target, meta: DeptMeta): Filter | null {
  switch (t.kind) {
    case 'group':
      return meta.index ? { kind: 'group', key: t.key, index: meta.index } : null;
    case 'tutor':
      return { kind: 'tutor', username: t.id };
    case 'room':
      return { kind: 'room', name: t.id };
    case 'module':
      return { kind: 'module', abbrev: t.id };
  }
}

function defaultDay(week: IsoWeek, days: DayRef[], now: Date): DayRef {
  if (sameWeek(isoWeekOf(now), week)) {
    const today = DAY_REFS[(now.getDay() + 6) % 7];
    if (days.includes(today)) return today;
  }
  return days[0];
}

export function TimetableView({ route, meta, compact, showMenu, onChangeTarget }: Props) {
  const now = useNow();
  const wide = useIsWide();
  const week = route.week ?? displayWeekFor(now);
  const data = useWeekData(route.dept, week);
  const menu = useMenu(showMenu);
  const [open, setOpen] = useState<Course | null>(null);

  const filter = toFilter(route.target, meta);
  const courses = useMemo(
    () => (filter && data.status === 'ready' ? filterCourses(data.courses, filter) : []),
    [data.courses, data.status, filter && JSON.stringify({ ...filter, index: undefined }), meta.index],
  );
  const days = useMemo(() => {
    const extra = (['sa', 'su'] as DayRef[]).filter((d) => courses.some((c) => c.day === d));
    return [...WEEKDAYS, ...extra];
  }, [courses]);

  const pendingDay = useRef<DayRef | null>(null);
  const [day, setDay] = useState<DayRef>(() => defaultDay(week, days, now));
  useEffect(() => {
    setDay(pendingDay.current ?? defaultDay(week, days, now));
    pendingDay.current = null;
  }, [weekKey(week)]);

  const [dir, setDir] = useState<1 | -1 | 0>(0);
  const go = (w: IsoWeek, nextDay?: DayRef) => {
    const a = dateOf(w, 'm').getTime();
    const b = dateOf(week, 'm').getTime();
    setDir(a > b ? 1 : a < b ? -1 : 0);
    pendingDay.current = nextDay ?? null;
    navigate({ ...route, week: w }, true);
  };
  const swipe = (step: 1 | -1) => {
    const i = days.indexOf(day) + step;
    if (i >= 0 && i < days.length) {
      setDir(step);
      setDay(days[i]);
    }
    else go(addWeeks(week, step), step === 1 ? 'm' : 'f');
  };

  const showGroups = route.target.kind !== 'group';
  const loading = data.status === 'loading' || (route.target.kind === 'group' && meta.status === 'loading');
  const error = data.status === 'error' || (route.target.kind === 'group' && meta.status === 'error');
  const retry = () => {
    data.retry();
    if (meta.status === 'error') meta.retry();
  };

  let body;
  if (error) {
    body = (
      <div class="state" role="alert">
        <strong>Impossible de joindre flopEDT</strong>
        <span>Vérifie ta connexion, puis réessaie.</span>
        <button class="btn btn-primary" onClick={retry}>
          Réessayer
        </button>
      </div>
    );
  } else if (loading) {
    body = (
      <div class="dayview" aria-busy="true" aria-label="Chargement">
        <div class="skeleton" />
        <div class="skeleton" />
        <div class="skeleton" />
      </div>
    );
  } else if (courses.length === 0) {
    body = (
      <div class="state">
        <strong>Pas de cours cette semaine</strong>
        <button class="btn" onClick={() => go(addWeeks(week, 1))}>
          Voir la semaine suivante
        </button>
      </div>
    );
  } else if (wide || compact) {
    body = (
      <WeekGrid
        week={week}
        days={days}
        courses={courses}
        compact={!wide}
        showGroups={showGroups}
        now={now}
        onOpen={setOpen}
        onSwipeWeek={(d) => go(addWeeks(week, d))}
      />
    );
    const today = menuFor(menu, now);
    if (today && sameWeek(isoWeekOf(now), week)) {
      body = (
        <>
          {body}
          <div class="menu-below">
            <MenuCard day={today} restaurant={menu!.restaurant} />
          </div>
        </>
      );
    }
  } else {
    body = (
      <DayView
        date={dateOf(week, day)}
        courses={courses.filter((c) => c.day === day)}
        showGroups={showGroups}
        now={now}
        onOpen={setOpen}
        onSwipe={swipe}
        menu={(() => {
          const m = menuFor(menu, dateOf(week, day));
          return m ? { day: m, restaurant: menu!.restaurant } : null;
        })()}
      />
    );
  }

  const busy = new Set(courses.map((c) => c.day));
  const current = displayWeekFor(now);

  return (
    <>
      <TopBar
        title={targetTitle(route.target, meta, data.courses)}
        onTitle={onChangeTarget}
        week={week}
        isCurrentWeek={sameWeek(week, current)}
        onWeek={(d) => go(addWeeks(week, d))}
        onToday={() => go(current)}
      >
        {route.target.kind !== 'group' && (
          <a class="btn" href={formatRoute({ view: 'lister', dept: route.dept, target: route.target })}>
            Lister les prochains cours
          </a>
        )}
        {data.offlineSince && (
          <p class="status" role="status">
            Hors ligne — données du {formatStamp(data.offlineSince)}
          </p>
        )}
        {!wide && !compact && !error && (
          <DayStrip
            week={week}
            days={days}
            selected={day}
            busy={busy}
            now={now}
            onSelect={(d) => {
              setDir(days.indexOf(d) >= days.indexOf(day) ? 1 : -1);
              setDay(d);
            }}
            onSwipeWeek={(d) => go(addWeeks(week, d))}
          />
        )}
      </TopBar>
      <main class="main">
        <div key={`${weekKey(week)}-${wide || compact ? '' : day}`} class={dir ? `slide slide-${dir === 1 ? 'next' : 'prev'}` : undefined}>
          {body}
        </div>
      </main>
      {open && <CourseSheet course={open} tutors={meta.tutors} onClose={() => setOpen(null)} />}
    </>
  );
}
