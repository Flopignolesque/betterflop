// Parses the menu section of a CROUS restaurant page (crous-toulouse.fr).
// No imports: this file also runs in Node (scripts/fetch-menu.ts).

export type MenuSection = { title: string; items: string[] };
export type Meal = { title: string; sections: MenuSection[]; subjectToChange: boolean };
export type DayMenu = { date: string; meals: Meal[] };
export type MenuFile = { source: string; restaurant: string; fetchedAt: string; days: DayMenu[] };

const NAMED: Record<string, string> = {
  amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', rsquo: '’', lsquo: '‘', laquo: '«', raquo: '»',
  eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë', agrave: 'à', acirc: 'â', auml: 'ä', ccedil: 'ç',
  icirc: 'î', iuml: 'ï', ocirc: 'ô', ouml: 'ö', ucirc: 'û', ugrave: 'ù', uuml: 'ü', oelig: 'œ',
  Eacute: 'É', Egrave: 'È', Ecirc: 'Ê', Agrave: 'À', Ccedil: 'Ç', OElig: 'Œ',
};

function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1));
    return NAMED[e] ?? m;
  });
}

const text = (html: string) => decode(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

const SECTION_NAMES: Record<string, string> = {
  ENTREES: 'Entrées',
  'ENTRÉES': 'Entrées',
  'MENU TRADITIONNEL': 'Menu traditionnel',
  DESSERTS: 'Desserts',
};

function sectionTitle(raw: string): string {
  const t = raw.trim();
  const known = SECTION_NAMES[t.toUpperCase()];
  if (known) return known;
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

const RESERVE = /sous r[ée]serve/i;

export function parseCrousMenu(html: string): DayMenu[] {
  const days: DayMenu[] = [];
  const blocks = html.split(/<div class="menu">/).slice(1);
  for (const block of blocks) {
    const date = /datetime="(\d{4}-\d{2}-\d{2})"/.exec(block)?.[1];
    if (!date) continue;
    const meals: Meal[] = [];
    for (const mealHtml of block.split(/<div class="meal">/).slice(1)) {
      const title = text(/<h4 class="meal_title">([\s\S]*?)<\/h4>/.exec(mealHtml)?.[1] ?? 'Repas');
      const foodies = /<ul class="meal_foodies">([\s\S]*)<\/ul>/.exec(mealHtml)?.[1] ?? '';
      const sections: MenuSection[] = [];
      let subjectToChange = false;
      for (const m of foodies.matchAll(/<li>([^<]*)<ul>([\s\S]*?)<\/ul>\s*<\/li>/g)) {
        const items: string[] = [];
        for (const it of m[2].matchAll(/<li>([\s\S]*?)<\/li>/g)) {
          const t = text(it[1]).replace(/^\*\s*/, '');
          if (!t) continue;
          if (RESERVE.test(t)) subjectToChange = true;
          else items.push(t);
        }
        if (items.length) sections.push({ title: sectionTitle(decode(m[1])), items });
      }
      if (sections.length) meals.push({ title, sections, subjectToChange });
    }
    if (meals.length) days.push({ date, meals });
  }
  return days;
}
