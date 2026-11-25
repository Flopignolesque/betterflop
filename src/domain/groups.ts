import type { RawGroupNode, RawTransversal } from '../api/types';

/** `${promo}|${name}` — names repeat across promos (INFO), so the promo is part of the key. */
export type GroupKey = string;

export type GroupNode = {
  key: GroupKey;
  promo: string;
  promoLabel: string;
  name: string;
  parent: GroupKey | null;
  children: GroupKey[];
  depth: number;
};

export type TransversalGroup = { key: GroupKey; promo: string; name: string; conflicts: GroupKey[] };

export type GroupIndex = {
  promos: { promo: string; label: string; root: GroupKey }[];
  nodes: Map<GroupKey, GroupNode>;
  transversal: TransversalGroup[];
};

export const groupKey = (promo: string, name: string): GroupKey => `${promo}|${name}`;

export function splitGroupKey(key: GroupKey): { promo: string; name: string } {
  const i = key.indexOf('|');
  return { promo: key.slice(0, i), name: key.slice(i + 1) };
}

export function buildGroupIndex(tree: RawGroupNode[], transversal: RawTransversal[]): GroupIndex {
  const nodes = new Map<GroupKey, GroupNode>();
  const promos: GroupIndex['promos'] = [];

  const visit = (raw: RawGroupNode, promo: string, label: string, parent: GroupKey | null, depth: number) => {
    const key = groupKey(promo, raw.name);
    const node: GroupNode = { key, promo, promoLabel: label, name: raw.name, parent, children: [], depth };
    nodes.set(key, node);
    for (const child of raw.children ?? []) {
      node.children.push(visit(child, promo, label, key, depth + 1));
    }
    return key;
  };

  for (const root of tree) {
    const promo = root.promo ?? root.name;
    const label = root.promotxt ?? root.buttxt ?? promo;
    promos.push({ promo, label, root: visit(root, promo, label, null, 0) });
  }

  return {
    promos,
    nodes,
    transversal: transversal.map((t) => ({
      key: groupKey(t.train_prog, t.name),
      promo: t.train_prog,
      name: t.name,
      conflicts: t.conflicting_groups.map((c) => groupKey(t.train_prog, c.name)),
    })),
  };
}

export function ancestorsOf(index: GroupIndex, key: GroupKey): GroupKey[] {
  const out: GroupKey[] = [];
  let cur: GroupKey | null = key;
  while (cur && index.nodes.has(cur)) {
    out.push(cur);
    cur = index.nodes.get(cur)!.parent;
  }
  return out;
}

export function descendantsOf(index: GroupIndex, key: GroupKey): GroupKey[] {
  const out: GroupKey[] = [];
  const stack = [...(index.nodes.get(key)?.children ?? [])];
  while (stack.length) {
    const k = stack.pop()!;
    out.push(k);
    stack.push(...(index.nodes.get(k)?.children ?? []));
  }
  return out;
}

export function leavesOf(index: GroupIndex, promo: string): GroupKey[] {
  const root = index.promos.find((p) => p.promo === promo)?.root;
  if (!root) return [];
  return [root, ...descendantsOf(index, root)]
    .filter((k) => index.nodes.get(k)!.children.length === 0)
    .sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
}

/** Groups whose courses concern `key`: itself, its ancestors, and transversal groups overlapping it. */
export function relevantGroupKeys(index: GroupIndex, key: GroupKey): Set<GroupKey> {
  const ancestors = ancestorsOf(index, key);
  const out = new Set<GroupKey>(ancestors.length ? ancestors : [key]);
  const overlap = new Set([...out, ...descendantsOf(index, key)]);
  for (const t of index.transversal) {
    if (t.conflicts.some((c) => overlap.has(c))) out.add(t.key);
  }
  return out;
}
