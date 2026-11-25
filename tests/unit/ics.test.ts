import { parseIcsLinks } from '../../src/domain/ics';
import { fixture } from '../helpers';

const links = parseIcsLinks(fixture('ics-RT.html'));

test('group, tutor and room links', () => {
  expect(links.groups.get('1E')).toBe('https://flopedt.iut-blagnac.fr/fr/ics/RT/structural_group/538.ics');
  expect(links.tutors.get('AAUP')).toMatch(/\/fr\/ics\/RT\/tutor\/\d+\.ics$/);
  expect(links.rooms.get('A011')).toMatch(/\/fr\/ics\/RT\/room\/\d+\.ics$/);
});

test('ambiguous group names give no link', () => {
  const html = '<a href="/fr/ics/INFO/structural_group/1.ics">Copier ce lien - 1A</a>' +
    '<a href="/fr/ics/INFO/structural_group/2.ics">Copier ce lien - 1A</a>';
  expect(parseIcsLinks(html).groups.has('1A')).toBe(false);
});
