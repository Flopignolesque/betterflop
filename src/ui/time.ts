import type { Course } from '../domain/courses';

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export const minutesOf = (d: Date) => d.getHours() * 60 + d.getMinutes();

export function courseState(c: Course, now: Date): 'now' | 'past' | null {
  const day = new Date(c.date.getFullYear(), c.date.getMonth(), c.date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (day < today) return 'past';
  if (day > today) return null;
  const m = minutesOf(now);
  if (m >= c.end) return 'past';
  if (m >= c.start) return 'now';
  return null;
}

export function formatGap(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h${m ? String(m).padStart(2, '0') : ''}` : `${m} min`;
}
