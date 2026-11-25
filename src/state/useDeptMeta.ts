import { useEffect, useState } from 'preact/hooks';
import { getGroupTree, getTransversalGroups, getTutors } from '../api/flop';
import type { RawTutor } from '../api/types';
import { buildGroupIndex, type GroupIndex } from '../domain/groups';

export type DeptMeta = {
  status: 'loading' | 'ready' | 'error';
  index: GroupIndex | null;
  tutors: Map<string, RawTutor>;
  retry(): void;
};

export async function loadGroupIndex(dept: string): Promise<GroupIndex> {
  const [tree, transversal] = await Promise.all([
    getGroupTree(dept),
    getTransversalGroups(dept).catch(() => []),
  ]);
  return buildGroupIndex(tree, transversal);
}

export function tutorName(t: RawTutor | undefined, fallback: string): string {
  if (!t) return fallback;
  const name = `${t.first_name ?? ''} ${t.last_name ?? ''}`.trim();
  return name || fallback;
}

/** Group tree + tutor directory of a department (tutors are optional). */
export function useDeptMeta(dept: string | null): DeptMeta {
  const [state, setState] = useState<Omit<DeptMeta, 'retry'>>({ status: 'loading', index: null, tutors: new Map() });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!dept) return;
    let alive = true;
    setState((s) => ({ ...s, status: 'loading' }));
    loadGroupIndex(dept).then(
      (index) => alive && setState((s) => ({ ...s, status: 'ready', index })),
      () => alive && setState((s) => ({ ...s, status: 'error' })),
    );
    getTutors(dept).then(
      (list) => alive && setState((s) => ({ ...s, tutors: new Map(list.map((t) => [t.username, t])) })),
      () => {},
    );
    return () => {
      alive = false;
    };
  }, [dept, attempt]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
