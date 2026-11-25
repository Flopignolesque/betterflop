import { LANG } from '../config';
import type { IsoWeek } from '../domain/week';
import { fetchJson, fetchText } from './client';
import type {
  RawConstraints,
  RawGroupNode,
  RawModule,
  RawRooms,
  RawScheduledCourse,
  RawTransversal,
  RawTutor,
} from './types';

const api = (path: string, params: Record<string, string | number>) =>
  `/${LANG}/api/${path}?` +
  Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

export const scheduledCoursesPath = (dept: string, w: IsoWeek) =>
  api('fetch/scheduledcourses/', { dept, week: w.week, year: w.year, work_copy: 0 });

export const getScheduledCourses = (dept: string, w: IsoWeek) =>
  fetchJson<RawScheduledCourse[]>(scheduledCoursesPath(dept, w));

export const getConstraints = (dept: string) =>
  fetchJson<RawConstraints>(api('fetch/constraints/', { dept }));

export const getGroupTree = (dept: string) =>
  fetchJson<RawGroupNode[]>(api('groups/structural/tree/', { dept }));

export const getTransversalGroups = (dept: string) =>
  fetchJson<RawTransversal[]>(api('groups/transversal/', { dept }));

export async function getTutors(dept: string): Promise<RawTutor[]> {
  const raw = await fetchJson<(RawTutor & { email?: string })[]>(api('user/tutor/', { dept }));
  return raw.map(({ username, first_name, last_name, departments }) => ({
    username,
    first_name,
    last_name,
    departments: departments ?? [],
  }));
}

export const getModules = (dept: string) =>
  fetchJson<RawModule[]>(`/${LANG}/edt/${encodeURIComponent(dept)}/fetch_all_modules_with_desc`);

export async function getRooms(dept: string): Promise<string[]> {
  const raw = await fetchJson<RawRooms>(api('rooms/all/', { dept }));
  const all = new Set(Object.values(raw.roomtypes ?? {}).flat());
  return [...all].sort((a, b) => a.localeCompare(b, 'fr'));
}

export const getHomeHtml = () => fetchText('/');

export const getIcsHtml = (dept: string) => fetchText(`/${LANG}/ics/${encodeURIComponent(dept)}/`);
