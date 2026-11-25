// Downloads the Resto U' Blagnac menu and writes it as JSON for the site.
// Usage: node scripts/fetch-menu.ts public/menu.json
import { writeFileSync } from 'node:fs';
import { parseCrousMenu, type MenuFile } from '../src/domain/crous.ts';

const SOURCE = 'https://www.crous-toulouse.fr/restaurant/resto-u-blagnac/';
const out = process.argv[2] ?? 'public/menu.json';

const res = await fetch(SOURCE, { headers: { 'user-agent': 'betterflop-menu/1.0' } });
if (!res.ok) throw new Error(`CROUS answered ${res.status}`);
const days = parseCrousMenu(await res.text());

const file: MenuFile = { source: SOURCE, restaurant: "Resto U' Blagnac", fetchedAt: new Date().toISOString(), days };
writeFileSync(out, JSON.stringify(file));
console.log(`menu: ${days.length} day(s) → ${out}`);
