import { useEffect, useState } from 'preact/hooks';
import { loadDepartments, type Department } from '../domain/departments';
import type { GroupIndex, GroupKey } from '../domain/groups';
import { loadGroupIndex } from '../state/useDeptMeta';
import { Icon } from './Icon';

type Props = {
  onPick(dept: string, key: GroupKey): void;
  initialDept?: string | null;
};

export function GroupPicker({ onPick, initialDept }: Props) {
  const [depts, setDepts] = useState<Department[] | null>(null);
  const [dept, setDept] = useState<string | null>(initialDept ?? null);
  const [index, setIndex] = useState<GroupIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const [promo, setPromo] = useState<string | null>(null);
  const [path, setPath] = useState<GroupKey[]>([]);

  useEffect(() => {
    loadDepartments().then(setDepts);
  }, []);

  useEffect(() => {
    setIndex(null);
    setFailed(false);
    if (!dept) return;
    let alive = true;
    loadGroupIndex(dept).then(
      (i) => alive && setIndex(i),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, [dept]);

  const back = () => {
    if (path.length) setPath(path.slice(0, -1));
    else if (promo) setPromo(null);
    else setDept(null);
  };

  if (!dept) {
    return (
      <div class="picker">
        <p class="level">Ton département</p>
        <div class="choice-list">
          {!depts && <div class="skeleton" />}
          {depts?.map((d) => (
            <button class="btn choice" onClick={() => setDept(d.code)}>
              {d.name}
              <small>{d.code}</small>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const deptName = depts?.find((d) => d.code === dept)?.name ?? dept;
  const header = (
    <div class="sheet-head" style="margin:0">
      <button class="btn btn-ghost icon-btn" onClick={back} aria-label="Retour">
        <Icon name="back" />
      </button>
      <strong style="flex:1">{deptName}</strong>
    </div>
  );

  if (failed) {
    return (
      <div class="picker">
        {header}
        <div class="state" role="alert">
          <strong>Impossible de charger les groupes</strong>
          <button class="btn btn-primary" onClick={() => setDept(dept + '')}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!index) {
    return (
      <div class="picker">
        {header}
        <div class="skeleton" />
      </div>
    );
  }

  if (!promo) {
    return (
      <div class="picker">
        {header}
        <p class="level">Ton année</p>
        <div class="choice-list">
          {index.promos.map((p) => (
            <button class="btn choice" onClick={() => setPromo(p.promo)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const root = index.promos.find((p) => p.promo === promo)!;
  const rootNode = index.nodes.get(root.root)!;
  const levels: { parent: GroupKey; options: GroupKey[] }[] = [];
  let cur = rootNode;
  for (let i = 0; cur && cur.children.length; i++) {
    levels.push({ parent: cur.key, options: cur.children });
    const next = path[i];
    if (!next) break;
    cur = index.nodes.get(next)!;
  }
  const selected = path.length ? index.nodes.get(path[path.length - 1])! : null;

  const choose = (depth: number, key: GroupKey) => {
    const node = index.nodes.get(key)!;
    if (node.children.length === 0) onPick(dept, key);
    else setPath([...path.slice(0, depth), key]);
  };

  return (
    <div class="picker">
      {header}
      <p class="level">{root.label}</p>
      {levels.map((lvl, depth) => (
        <>
          <p class="level">{depth === 0 ? 'Ton groupe' : `Dans ${index.nodes.get(lvl.parent)!.name}`}</p>
          <div class="chips">
            {lvl.options.map((k) => (
              <button class="chip" aria-pressed={path[depth] === k} onClick={() => choose(depth, k)}>
                {index.nodes.get(k)!.name}
              </button>
            ))}
          </div>
        </>
      ))}
      <div class="picker-actions">
        {selected ? (
          <button class="btn" onClick={() => onPick(dept, selected.key)}>
            Tout le groupe {selected.name}
          </button>
        ) : (
          <button class="btn" onClick={() => onPick(dept, root.root)}>
            Toute la promo {root.label}
          </button>
        )}
      </div>
    </div>
  );
}
