import { render, screen } from '@testing-library/preact';
import { App } from '../../src/ui/App';

test('renders app shell with navigation', () => {
  render(<App />);
  expect(screen.getByRole('navigation')).toHaveTextContent('Mon EDT');
});
