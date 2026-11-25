import { useEffect, useState } from 'preact/hooks';
import { loadDepartments, type Department } from '../domain/departments';
import { loadPrefs } from '../state/prefs';
import { EntitySearch } from './EntitySearch';
import { navigate } from './hooks';

export function SearchView() {
  const [depts, setDepts] = useState<Department[]>([]);
  const [dept, setDept] = useState(() => loadPrefs().dept ?? 'RT');

  useEffect(() => {
    loadDepartments().then(setDepts);
  }, []);

  return (
    <main class="main">
      <div class="home">
        <div>
          <h1>Chercher</h1>
          <p>Un prof, un module ou une salle : vois sa semaine ou ses prochains cours.</p>
        </div>
        {depts.length > 1 && (
          <div class="chips" role="group" aria-label="Département">
            {depts.map((d) => (
              <button class="chip" aria-pressed={d.code === dept} onClick={() => setDept(d.code)} title={d.name}>
                {d.code}
              </button>
            ))}
          </div>
        )}
        <EntitySearch dept={dept} onPick={(target) => navigate({ view: 'timetable', dept, target, week: null })} />
      </div>
    </main>
  );
}
