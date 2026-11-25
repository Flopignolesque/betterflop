import { useEffect, useState } from 'preact/hooks';
import { loadPrefs, savePrefs } from '../state/prefs';
import { useDeptMeta } from '../state/useDeptMeta';
import { BottomNav } from './BottomNav';
import { GroupPicker } from './GroupPicker';
import { HomeView, openGroup } from './HomeView';
import { ListerView } from './ListerView';
import { ModeContext, navigate, useRoute } from './hooks';
import { SearchView } from './SearchView';
import { SettingsView } from './SettingsView';
import { Sheet } from './Sheet';
import { TimetableView } from './TimetableView';
import { useTheme } from './useTheme';

export function App() {
  const { mode, theme, setTheme } = useTheme();
  const [, setPrefsVersion] = useState(0);
  const route = useRoute();
  const prefs = loadPrefs();
  const dept = route.view === 'timetable' || route.view === 'lister' ? route.dept : prefs.dept;
  const meta = useDeptMeta(dept);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    if (route.view === 'timetable' && route.target.kind === 'group') {
      savePrefs({ dept: route.dept, group: route.target.key });
    }
    setPicking(false);
  }, [route]);

  let view;
  switch (route.view) {
    case 'timetable':
      view = (
        <TimetableView
          route={route}
          meta={meta}
          compact={prefs.compactWeek}
          onChangeTarget={() => (route.target.kind === 'group' ? setPicking(true) : navigate('#/chercher'))}
        />
      );
      break;
    case 'lister':
      view = <ListerView route={route} meta={meta} />;
      break;
    case 'search':
      view = <SearchView />;
      break;
    case 'home':
      view = <HomeView />;
      break;
    case 'settings':
      view = <SettingsView theme={theme} setTheme={setTheme} onPrefsChange={() => setPrefsVersion((n) => n + 1)} />;
      break;
  }

  return (
    <ModeContext.Provider value={mode}>
      <div class="app">
        {view}
        <BottomNav route={route} />
        {picking && route.view === 'timetable' && (
          <Sheet title="Changer de groupe" onClose={() => setPicking(false)}>
            <GroupPicker initialDept={route.dept} onPick={(d, k) => openGroup(d, k)} />
          </Sheet>
        )}
      </div>
    </ModeContext.Provider>
  );
}
