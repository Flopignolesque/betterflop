import { loadDepartments, parseDepartments } from '../../src/domain/departments';
import { clearCache } from '../../src/api/client';
import { FALLBACK_DEPARTMENTS } from '../../src/config';
import { fixture } from '../helpers';

afterEach(() => { vi.unstubAllGlobals(); clearCache(); });

test('parses the 5 departments from the home page', () => {
  const depts = parseDepartments(fixture('home.html'));
  expect(depts).toHaveLength(5);
  expect(depts).toContainEqual({ code: 'RT', name: 'Réseaux et Télécommunications' });
});

test('empty html → no departments', () => {
  expect(parseDepartments('')).toEqual([]);
});

test('loadDepartments falls back when flopEDT is unreachable', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
  await expect(loadDepartments()).resolves.toEqual(FALLBACK_DEPARTMENTS);
});
