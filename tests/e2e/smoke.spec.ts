import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fx = (name: string) => readFileSync(resolve(process.cwd(), 'tests/fixtures', name), 'utf8');

const ROUTES: [RegExp, string][] = [
  [/\/fr\/api\/fetch\/scheduledcourses\/\?dept=RT&week=48&year=2026/, 'sc-RT-2026-48.json'],
  [/\/fr\/api\/fetch\/scheduledcourses\//, '[]'],
  [/\/fr\/api\/fetch\/constraints\//, 'constraints-RT.json'],
  [/\/fr\/api\/groups\/structural\/tree\//, 'tree-RT.json'],
  [/\/fr\/api\/groups\/transversal\//, 'transversal-RT.json'],
  [/\/fr\/api\/user\/tutor\//, 'tutors-RT.json'],
  [/\/fr\/ics\/RT\//, 'ics-RT.html'],
  [/^https:\/\/flopedt\.iut-blagnac\.fr\/$/, 'home.html'],
];

async function mockFlop(page: Page) {
  await page.route('https://flopedt.iut-blagnac.fr/**', async (route) => {
    const url = route.request().url();
    const hit = ROUTES.find(([re]) => re.test(url));
    if (!hit) return route.fulfill({ status: 404, body: 'not found' });
    const body = hit[1].endsWith('.json') || hit[1].endsWith('.html') ? fx(hit[1]) : hit[1];
    await route.fulfill({
      status: 200,
      body,
      headers: { 'content-type': hit[1].endsWith('.html') ? 'text/html' : 'application/json', 'access-control-allow-origin': '*' },
    });
  });
  await page.route('https://fonts.**', (r) => r.abort());
}

test('first visit → pick 1E → see timetable → remembered → dark theme', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 10, 24, 10, 0));
  await mockFlop(page);
  await page.goto('/');

  await page.getByRole('button', { name: /Réseaux et Télécommunications/ }).click();
  await page.getByRole('button', { name: 'BUT1', exact: true }).click();
  await page.getByRole('button', { name: '1G3', exact: true }).click();
  await page.getByRole('button', { name: '1E', exact: true }).click();

  await expect(page.getByRole('button', { name: /R101/ })).toBeVisible();
  await expect(page).toHaveURL(/#\/RT\/groupe\/BUT1\/1E$/);

  await page.goto('/');
  await expect(page.getByRole('button', { name: /R101/ })).toBeVisible();

  await page.getByRole('link', { name: 'Réglages' }).click();
  await page.getByRole('button', { name: 'Sombre' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  const [scrollW, innerW] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(scrollW).toBeLessThanOrEqual(innerW);
});
