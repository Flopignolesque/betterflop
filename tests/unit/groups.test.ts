import { ancestorsOf, buildGroupIndex, leavesOf, relevantGroupKeys } from '../../src/domain/groups';
import type { RawGroupNode, RawTransversal } from '../../src/api/types';
import { fixtureJson } from '../helpers';

const rt = buildGroupIndex(fixtureJson<RawGroupNode[]>('tree-RT.json'), []);
const info = buildGroupIndex(fixtureJson<RawGroupNode[]>('tree-INFO.json'), []);
const gim = buildGroupIndex(
  fixtureJson<RawGroupNode[]>('tree-GIM.json'),
  fixtureJson<RawTransversal[]>('transversal-GIM.json'),
);

test('RT promos and ancestors', () => {
  expect(rt.promos.map((p) => p.promo)).toEqual(['BUT1', 'BUT2', 'BUT2A', 'BUT3', 'BUT3A']);
  expect(ancestorsOf(rt, 'BUT1|1E')).toEqual(['BUT1|1E', 'BUT1|1G3', 'BUT1|BUT1']);
  expect(rt.nodes.get('BUT1|1E')).toMatchObject({ promo: 'BUT1', name: '1E', parent: 'BUT1|1G3', depth: 2 });
});

test('INFO: deep tree, roots named CE, names repeated across promos', () => {
  expect(info.promos.map((p) => p.label)).toEqual(['BUT1', 'BUT2', 'BUT3']);
  expect(ancestorsOf(info, 'BUT2|1A')).toEqual(['BUT2|1A', 'BUT2|1', 'BUT2|12', 'BUT2|CE']);
  expect(info.nodes.get('BUT1|1A')).toBeDefined();
  expect(info.nodes.get('BUT1|1A')!.parent).toBe('BUT1|1');
  expect(info.nodes.get('BUT2|1A')!.parent).toBe('BUT2|1');
});

test('GIM transversal groups are relevant to overlapping structural groups', () => {
  const keys = relevantGroupKeys(gim, 'GIM1|1A');
  expect(keys.has('GIM1|1STA')).toBe(true);
  expect(keys.has('GIM1|1TA')).toBe(true);
  expect(keys.has('GIM1|1EEM')).toBe(false);
  expect(keys.has('GIM1|1TD1')).toBe(true);
  expect(keys.has('GIM1|GIM1')).toBe(true);
  expect(keys.has('GIM1|1B')).toBe(false);
});

test('choosing a TD includes transversal groups of its sub-groups', () => {
  expect(relevantGroupKeys(gim, 'GIM1|1TD2').has('GIM1|1EEM')).toBe(true);
});

test('leavesOf', () => {
  expect(leavesOf(rt, 'BUT1')).toEqual(['BUT1|1A', 'BUT1|1B', 'BUT1|1C', 'BUT1|1D', 'BUT1|1E', 'BUT1|1F']);
});
