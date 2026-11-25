import { parseCrousMenu } from '../../src/domain/crous';
import { fixture } from '../helpers';

const menu = parseCrousMenu(fixture('crous-blagnac.html'));

test('parses the 3 days of lunch menus', () => {
  expect(menu.map((d) => d.date)).toEqual(['2026-11-25', '2026-11-26', '2026-11-27']);
  const wed = menu[0];
  expect(wed.meals).toHaveLength(1);
  expect(wed.meals[0].title).toBe('Déjeuner');
  expect(wed.meals[0].sections.map((s) => s.title)).toEqual(['Entrées', 'Menu traditionnel', 'Desserts']);
});

test('items are clean and the "sous réserve" line becomes a flag', () => {
  const thu = menu[1].meals[0];
  expect(thu.sections[1].items).toEqual([
    'Cordon bleu à la bolognaise', 'Poisson du jour', 'Crumble butternut, pomme de terre', 'Channa massala riz', 'Poêlée rustique',
  ]);
  expect(thu.subjectToChange).toBe(true);
  expect(menu[2].meals[0].subjectToChange).toBe(false);
  expect(thu.sections[0].items).toContain('Macédoine, œuf');
});

test('no menu section → empty list', () => {
  expect(parseCrousMenu('<html><body>Fermé</body></html>')).toEqual([]);
});

test('html entities are decoded', () => {
  const html = '<div class="menu"><time datetime="2026-12-01">x</time><div class="meal"><h4 class="meal_title">D&eacute;jeuner</h4>' +
    '<ul class="meal_foodies"><li>PLATS<ul><li>Poulet &amp; frites</li><li>Cr&#232;me br&ucirc;l&eacute;e</li></ul></li></ul></div></div>';
  const [day] = parseCrousMenu(html);
  expect(day.meals[0].title).toBe('Déjeuner');
  expect(day.meals[0].sections[0]).toEqual({ title: 'Plats', items: ['Poulet & frites', 'Crème brûlée'] });
});
