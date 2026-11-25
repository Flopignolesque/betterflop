import { useEffect } from 'preact/hooks';
import { loadPrefs, savePrefs } from '../state/prefs';
import { useDeptMeta } from '../state/useDeptMeta';
import { ModeContext, navigate, useRoute } from './hooks';
import { TimetableView } from './TimetableView';
import { useTheme } from './useTheme';

export function App() {
  const { mode } = useTheme();
  const route = useRoute();
  const prefs = loadPrefs();
  const dept = route.view === 'timetable' || route.view === 'lister' ? route.dept : prefs.dept;
  const meta = useDeptMeta(dept);

  useEffect(() => {
    if (route.view === 'timetable' && route.target.kind === 'group') {
      savePrefs({ dept: route.dept, group: route.target.key });
    }
  }, [route]);

  return (
    <ModeContext.Provider value={mode}>
      <div class="app">
        {route.view === 'timetable' ? (
          <TimetableView route={route} meta={meta} compact={prefs.compactWeek} onChangeTarget={() => navigate('#/')} />
        ) : (
          <main class="main">
            <h1>BetterFlop</h1>
          </main>
        )}
      </div>
    </ModeContext.Provider>
  );
}
