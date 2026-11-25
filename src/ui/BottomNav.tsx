import type { Route } from '../state/route';
import { Icon } from './Icon';

export function BottomNav({ route }: { route: Route }) {
  const mine = route.view === 'home' || (route.view === 'timetable' && route.target.kind === 'group');
  const search = route.view === 'search' || route.view === 'lister' || (route.view === 'timetable' && route.target.kind !== 'group');
  const items = [
    { href: '#/', label: 'Mon EDT', icon: 'calendar', current: mine },
    { href: '#/chercher', label: 'Chercher', icon: 'search', current: search },
    { href: '#/reglages', label: 'Réglages', icon: 'settings', current: route.view === 'settings' },
  ];
  return (
    <nav class="bottomnav" aria-label="Navigation">
      {items.map((i) => (
        <a href={i.href} aria-current={i.current ? 'page' : undefined}>
          <Icon name={i.icon} />
          {i.label}
        </a>
      ))}
    </nav>
  );
}
