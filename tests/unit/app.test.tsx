import { render, screen } from '@testing-library/preact';
import { App } from '../../src/ui/App';

test('renders app shell', () => {
  render(<App />);
  expect(screen.getByText('BetterFlop')).toBeInTheDocument();
});
