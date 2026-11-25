import { useEffect, useState } from 'preact/hooks';
import { loadPrefs, savePrefs } from '../state/prefs';
import { loadGroupIndex } from '../state/useDeptMeta';
import type { GroupKey } from '../domain/groups';
import { GroupPicker } from './GroupPicker';
import { navigate } from './hooks';

export function openGroup(dept: string, key: GroupKey, replace = false) {
  savePrefs({ dept, group: key });
  navigate({ view: 'timetable', dept, target: { kind: 'group', key }, week: null }, replace);
}

/** Sends people to their saved group, or asks them to pick one. */
export function HomeView() {
  const [checking, setChecking] = useState(() => {
    const p = loadPrefs();
    return !!(p.dept && p.group);
  });

  useEffect(() => {
    const { dept, group } = loadPrefs();
    if (!dept || !group) return;
    let alive = true;
    loadGroupIndex(dept).then(
      (index) => {
        if (!alive) return;
        if (index.nodes.has(group)) openGroup(dept, group, true);
        else setChecking(false);
      },
      // flopEDT unreachable: still try the saved group, the timetable shows the error.
      () => alive && openGroup(dept, group, true),
    );
    return () => {
      alive = false;
    };
  }, []);

  if (checking) {
    return (
      <main class="main">
        <div class="home">
          <div class="skeleton" />
        </div>
      </main>
    );
  }

  return (
    <main class="main">
      <div class="home">
        <div>
          <h1>Ton emploi du temps</h1>
          <p>Choisis ton groupe une fois, il est retenu pour la prochaine visite.</p>
        </div>
        <GroupPicker onPick={(d, k) => openGroup(d, k)} initialDept={loadPrefs().dept} />
      </div>
    </main>
  );
}
