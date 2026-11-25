export type IsoWeek = { year: number; week: number };
export type DayRef = 'm' | 'tu' | 'w' | 'th' | 'f' | 'sa' | 'su';
export const DAY_REFS: DayRef[] = ['m', 'tu', 'w', 'th', 'f', 'sa', 'su'];

const DAY_MS = 86_400_000;

/** Monday (local midnight) of the ISO week containing `date`. */
function mondayOf(date: Date): Date {
  const x = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = (x.getDay() + 6) % 7; // 0 = Monday
  x.setDate(x.getDate() - dow);
  return x;
}

export function isoWeekOf(date: Date): IsoWeek {
  const thursday = mondayOf(date);
  thursday.setDate(thursday.getDate() + 3);
  const year = thursday.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const week = 1 + Math.floor(Math.round((thursday.getTime() - jan1.getTime()) / DAY_MS) / 7);
  return { year, week };
}

/** Monday of ISO week 1 of `year` (week 1 contains Jan 4th). */
function week1Monday(year: number): Date {
  return mondayOf(new Date(year, 0, 4));
}

export function dateOf(w: IsoWeek, day: DayRef): Date {
  const x = week1Monday(w.year);
  x.setDate(x.getDate() + (w.week - 1) * 7 + DAY_REFS.indexOf(day));
  return x;
}

export function addWeeks(w: IsoWeek, n: number): IsoWeek {
  const monday = dateOf(w, 'm');
  monday.setDate(monday.getDate() + n * 7);
  return isoWeekOf(monday);
}

export function weeksInYear(year: number): number {
  return isoWeekOf(new Date(year, 11, 28)).week;
}

export function displayWeekFor(now: Date): IsoWeek {
  const dow = (now.getDay() + 6) % 7;
  const w = isoWeekOf(now);
  return dow >= 5 ? addWeeks(w, 1) : w;
}

export function sameWeek(a: IsoWeek, b: IsoWeek): boolean {
  return a.year === b.year && a.week === b.week;
}

export function weekKey(w: IsoWeek): string {
  return `${w.year}-W${String(w.week).padStart(2, '0')}`;
}

export function parseWeekKey(s: string): IsoWeek | null {
  const m = /^(\d{4})-W(\d{1,2})$/.exec(s);
  if (!m) return null;
  const year = +m[1];
  const week = +m[2];
  if (week < 1 || week > weeksInYear(year)) return null;
  return { year, week };
}

export function formatTime(min: number): string {
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`;
}

const SHORT_DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const pad = (n: number) => String(n).padStart(2, '0');

export function formatDayLabel(date: Date): string {
  return `${SHORT_DAYS[date.getDay()]} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

const LONG_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const SHORT_MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** "Mercredi 25 novembre" */
export function formatLongDay(date: Date): string {
  return `${LONG_DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** "Semaine 48 · 23–27 nov." */
export function formatWeekLabel(w: IsoWeek, lastDay: DayRef = 'f'): string {
  const a = dateOf(w, 'm');
  const b = dateOf(w, lastDay);
  const range =
    a.getMonth() === b.getMonth()
      ? `${a.getDate()}–${b.getDate()} ${SHORT_MONTHS[b.getMonth()]}`
      : `${a.getDate()} ${SHORT_MONTHS[a.getMonth()]} – ${b.getDate()} ${SHORT_MONTHS[b.getMonth()]}`;
  return `Semaine ${w.week} · ${range}`;
}
