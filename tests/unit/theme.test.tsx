import { render, screen, fireEvent } from '@testing-library/preact';
import { useTheme } from '../../src/ui/useTheme';
import { loadPrefs } from '../../src/state/prefs';

function Probe() {
  const { mode, setTheme } = useTheme();
  return <button onClick={() => setTheme('dark')}>{mode}</button>;
}

beforeEach(() => {
  localStorage.clear();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener() {}, removeEventListener() {} });
});

test('auto follows the system, explicit choice sets data-theme and is saved', () => {
  render(<Probe />);
  expect(screen.getByRole('button')).toHaveTextContent('light');
  expect(document.documentElement.dataset.theme).toBeUndefined();
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByRole('button')).toHaveTextContent('dark');
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(loadPrefs().theme).toBe('dark');
});
