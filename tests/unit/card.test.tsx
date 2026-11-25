import { render, screen } from '@testing-library/preact';
import { CourseCard } from '../../src/ui/CourseCard';
import { normalizeCourses } from '../../src/domain/courses';
import { fixtureJson } from '../helpers';

const [base] = normalizeCourses(fixtureJson('sc-RT-2026-48.json'), 'RT', { year: 2026, week: 48 }, fixtureJson('constraints-RT.json'));

test('exam cards are red, without the "Évalué" badge', () => {
  render(<CourseCard course={{ ...base, graded: true }} showGroups={false} onOpen={() => {}} />);
  const card = screen.getByRole('button');
  expect(card).toHaveClass('exam');
  expect(card).not.toHaveTextContent('Évalué');
});

test('regular cards are not marked as exams', () => {
  render(<CourseCard course={{ ...base, graded: false, type: 'TD' }} showGroups={false} onOpen={() => {}} />);
  expect(screen.getByRole('button')).not.toHaveClass('exam');
});
