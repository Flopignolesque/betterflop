# BetterFlop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un site statique (GitHub Pages) qui affiche les emplois du temps flopEDT de l'IUT de Blagnac, tous départements, en mieux : mobile d'abord, sobre, clair/sombre, vues groupe/prof/salle/module et rubrique « Lister ».

**Architecture:** SPA Preact sans serveur. Le navigateur lit directement l'API JSON de flopEDT (CORS `*` vérifié le 2026-11-25). Une couche `api/` récupère et met en cache, une couche `domain/` pure (testée en unitaire sur des fixtures réelles) normalise et filtre, une couche `ui/` affiche. Routage par hash, préférences en localStorage.

**Tech Stack:** Vite 5, TypeScript 5 (strict), Preact 10, Vitest + @testing-library/preact (jsdom), Playwright (e2e, Chromium préinstallé), vite-plugin-pwa, GitHub Actions → GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-25-betterflop-design.md`

## Global Constraints

- Base flopEDT : `https://flopedt.iut-blagnac.fr`, préfixe langue `/fr` ; un seul réglage dans `src/config.ts`.
- Départements : lus sur la page `/` (INFO, CS, GIM, RT, LPMA au 2026-11-25), liste en dur en secours.
- Lecture seule : aucun appel nécessitant une connexion (préférences, réservations, édition).
- Ne jamais afficher les e-mails des profs (l'API les renvoie) ; ne pas les mettre dans les fixtures.
- Mobile d'abord : cibles tactiles ≥ 44 px, utilisable à 360 px de large sans scroll horizontal.
- Thème : `auto` (suit le système) par défaut, `clair`, `sombre` au choix, mémorisé.
- Couleurs sobres : une couleur d'accent ; couleurs de module pastel (clair) / sourdes (sombre), dérivées du code module (stables) — on n'utilise pas les couleurs flopEDT.
- Identifiant d'un groupe = `promo` + `name` (les noms se répètent entre promos, ex. INFO `1A` en BUT1/BUT2/BUT3).
- Durée d'un cours = `constraints[course.type].duration`, 90 min si type inconnu.
- Semaines ISO 8601 (lundi = premier jour ; 2026 a 53 semaines).
- Textes de l'interface en français.

## Review Focus

1. Semaine sans cours (vacances) → message « Pas de cours cette semaine », pas d'écran vide ni d'erreur. *(test : Task 9)*
2. flopEDT injoignable / réponse non-JSON → message d'erreur + bouton « Réessayer », et si la semaine est en cache hors ligne, l'afficher avec « hors ligne, données du JJ/MM HH:MM ». *(tests : Task 2, Task 12)*
3. Cours sans salle (`room: null`, distanciel) ou sans prof (`tutor: null`) → affiché avec « Distanciel » / « — », jamais `null` ni plantage. *(test : Task 5)*
4. Groupes ambigus ou profonds (INFO : 3 niveaux, noms répétés entre promos) et groupes transversaux (GIM : options) → le groupe choisi voit exactement ses cours + ceux de ses ancêtres + ceux des transversaux qui le recoupent. *(tests : Task 4, Task 5)*
5. Changement d'année : semaine 53 de 2026 → semaine 1 de 2027 et retour ; « aujourd'hui » un samedi/dimanche → semaine suivante. *(test : Task 3)*

---

## Données flopEDT (relevé du 2026-11-25)

Tous les endpoints renvoient `access-control-allow-origin: *`. `{d}` = code département.

| Usage | URL | Forme |
|---|---|---|
| Cours d'une semaine | `/fr/api/fetch/scheduledcourses/?dept={d}&week={w}&year={y}&work_copy=0` | `[{id, room:{id,name}\|null, start_time (min depuis minuit), day:'m'\|'tu'\|'w'\|'th'\|'f'\|'sa'\|'su', tutor:string\|null, id_visio, number, course:{id, type, room_type, week, year, groups:[{id, train_prog, name, is_structural}], supp_tutor:[{username}], module:{name, abbrev, display}, pay_module, is_graded}}]` |
| Durées par type | `/fr/api/fetch/constraints/?dept={d}` | `{[type]: {duration, allowed_st}}` |
| Arbre des groupes | `/fr/api/groups/structural/tree/?dept={d}` | `[{promo, promotxt, name, children:[{name, parent, children?}]}]` (profondeur variable) |
| Groupes transversaux | `/fr/api/groups/transversal/?dept={d}` | `[{id, train_prog, name, conflicting_groups:[{name}]}]` |
| Profs | `/fr/api/user/tutor/?dept={d}` | `[{username, first_name, last_name, email, departments:[{abbrev}]}]` |
| Modules | `/fr/edt/{d}/fetch_all_modules_with_desc` | `[{abbrev, name, promo, resp, resp_first_name, resp_last_name, description}]` |
| Salles | `/fr/api/rooms/all/?dept={d}` | `{roomtypes: {[type]: string[]}}` |
| Départements | `/` (HTML) | `<li onclick="goTo('/en/edt/RT/');">Réseaux et Télécommunications</li>` |
| Liens iCal | `/fr/ics/{d}/` (HTML) | `<a href="/fr/ics/RT/structural_group/538.ics">Copier ce lien - 1E</a>`, idem `tutor/`, `room/` |

## File Structure

```
index.html                     point d'entrée, meta viewport, theme-color
vite.config.ts                 base './', preact, pwa, vitest (jsdom)
src/config.ts                  FLOP_BASE, LANG, LISTER_WEEKS=4, FALLBACK_DEPARTMENTS
src/main.tsx                   monte <App/>
src/api/types.ts               types bruts de l'API (Raw*)
src/api/client.ts              fetchJson/fetchText + cache mémoire + dédoublonnage
src/api/flop.ts                une fonction par endpoint
src/domain/week.ts             semaines ISO
src/domain/groups.ts           arbre de groupes, ancêtres, transversaux
src/domain/courses.ts          normalisation Course, filtres, mise en colonnes
src/domain/colors.ts           couleur de module selon thème
src/domain/departments.ts      parse page d'accueil
src/domain/ics.ts              parse page iCal
src/state/prefs.ts             localStorage protégé
src/state/route.ts             hash ⇄ Route
src/state/useWeekData.ts       hook : charge une semaine + préchargement
src/ui/App.tsx                 routeur, thème, layout
src/ui/TopBar.tsx              sélection actuelle, flèches semaine, aujourd'hui
src/ui/DayStrip.tsx            bandeau Lu–Ve + swipe (mobile)
src/ui/DayView.tsx             cours d'un jour en cartes
src/ui/WeekGrid.tsx            grille 5 colonnes (desktop + mode compact)
src/ui/CourseCard.tsx          carte de cours
src/ui/CourseSheet.tsx         détail d'un cours (feuille du bas)
src/ui/Sheet.tsx               feuille du bas générique
src/ui/GroupPicker.tsx         dept → promo → groupes
src/ui/EntitySearch.tsx        recherche prof / salle / module
src/ui/ListerView.tsx          prochains cours d'un prof/module/salle
src/ui/SettingsView.tsx        thème, mode compact, lien iCal
src/ui/styles.css              tokens clair/sombre, layout
tests/fixtures/*.json|html     captures réelles (e-mails retirés)
tests/unit/*.test.ts(x)
tests/e2e/smoke.spec.ts
.github/workflows/deploy.yml
```

---

### Task 1: Squelette, tests et déploiement GitHub Pages

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/ui/App.tsx`, `src/config.ts`, `.gitignore`, `.github/workflows/deploy.yml`
- Test: `tests/unit/app.test.tsx`

**Interfaces:**
- Produces: `src/config.ts` exporte `FLOP_BASE = 'https://flopedt.iut-blagnac.fr'`, `LANG = 'fr'`, `LISTER_WEEKS = 4`, `FALLBACK_DEPARTMENTS: {code: string; name: string}[]` (INFO Informatique, CS Carrières Sociales, GIM Génie Industriel et Maintenance, RT Réseaux et Télécommunications, LPMA LP Maintenance Aéronautique). Scripts npm : `dev`, `build` (`tsc --noEmit && vite build`), `test` (`vitest run`), `e2e` (`playwright test`).

- [ ] **Step 1: Test** — `renders app shell` : `render(<App/>)` → `screen.getByText('BetterFlop')` présent.
- [ ] **Step 2:** `npm test` → FAIL (App absent).
- [ ] **Step 3:** Initialiser Vite + Preact + TS strict ; `vite.config.ts` avec `base: './'` et `test: {environment: 'jsdom', include: ['tests/unit/**']}` ; `App` affiche le titre « BetterFlop ».
- [ ] **Step 4:** `npm test` → PASS ; `npm run build` → `dist/index.html` généré.
- [ ] **Step 5:** Workflow `deploy.yml` : sur push `main` + `workflow_dispatch`, `npm ci && npm test && npm run build`, puis `actions/upload-pages-artifact@v3` (`dist`) et `actions/deploy-pages@v4` (permissions `pages: write`, `id-token: write`).
- [ ] **Step 6:** Commit `chore: scaffold vite preact app with pages deploy`.

### Task 2: Fixtures réelles et client API

**Files:**
- Create: `tests/fixtures/` (voir Step 1), `src/api/types.ts`, `src/api/client.ts`, `src/api/flop.ts`
- Test: `tests/unit/client.test.ts`

**Interfaces:**
- Produces:
  - `types.ts` : `RawScheduledCourse`, `RawGroupNode {name: string; parent?: string; promo?: string; promotxt?: string; children?: RawGroupNode[]}`, `RawTransversal`, `RawTutor`, `RawModule`, `RawRooms`, `RawConstraints = Record<string, {duration: number}>` (formes : tableau « Données flopEDT »).
  - `client.ts` : `fetchJson<T>(path: string): Promise<T>`, `fetchText(path: string): Promise<string>` — préfixe `FLOP_BASE`, cache mémoire par URL, une seule requête en vol par URL, rejette avec `FlopError {kind: 'network'|'http'|'parse', status?: number}` ; `clearCache()` pour les tests.
  - `flop.ts` : `getScheduledCourses(dept, week: IsoWeek)`, `getConstraints(dept)`, `getGroupTree(dept)`, `getTransversalGroups(dept)`, `getTutors(dept)` (retire `email`), `getModules(dept)`, `getRooms(dept): Promise<string[]>` (union triée des `roomtypes`), `getHomeHtml()`, `getIcsHtml(dept)`.

- [ ] **Step 1: Capturer les fixtures** (accès réseau requis) : `sc-RT-2026-48.json`, `sc-GIM-2026-48.json`, `sc-INFO-2026-48.json`, `constraints-RT.json`, `tree-RT.json`, `tree-INFO.json`, `transversal-GIM.json`, `tutors-RT.json` (sans `email`), `modules-RT.json`, `rooms-RT.json`, `home.html`, `ics-RT.html`.
- [ ] **Step 2: Tests** (fetch mocké) :
  - `dedupes concurrent requests` : 2 appels simultanés même URL → `fetch` appelé 1 fois, même résultat.
  - `caches responses` : 2e appel après résolution → pas de nouveau `fetch`.
  - `network error → FlopError network` ; `500 → FlopError http status 500` ; `HTML au lieu de JSON → FlopError parse`. Après une erreur, l'URL n'est pas mise en cache (un nouvel appel refait `fetch`).
  - `getTutors strips email` : aucun objet ne contient la clé `email`.
  - `getRooms flattens roomtypes` : contient `'E104'`, sans doublon, trié.
  - `getScheduledCourses builds url` : URL appelée = `…/fr/api/fetch/scheduledcourses/?dept=RT&week=48&year=2026&work_copy=0`.
- [ ] **Step 3:** `npm test` → FAIL.
- [ ] **Step 4:** Implémenter.
- [ ] **Step 5:** `npm test` → PASS.
- [ ] **Step 6:** Commit `feat: flopedt api client with cache and fixtures`.

### Task 3: Semaines ISO

**Files:**
- Create: `src/domain/week.ts`
- Test: `tests/unit/week.test.ts`

**Interfaces:**
- Produces: `type IsoWeek = {year: number; week: number}`, `type DayRef = 'm'|'tu'|'w'|'th'|'f'|'sa'|'su'`, `DAY_REFS: DayRef[]` (dans l'ordre), `isoWeekOf(date: Date): IsoWeek`, `displayWeekFor(now: Date): IsoWeek` (samedi/dimanche → semaine suivante), `addWeeks(w: IsoWeek, n: number): IsoWeek`, `dateOf(w: IsoWeek, day: DayRef): Date`, `weekKey(w): string` (`'2026-W48'`), `parseWeekKey(s: string): IsoWeek | null`, `formatDayLabel(date): string` (`'mer. 25/11'`), `formatTime(min: number): string` (`480 → '8h00'`, `1125 → '18h45'`).

- [ ] **Step 1: Tests** :
  - `isoWeekOf(2026-11-25) = {2026,48}` ; `isoWeekOf(2026-12-31) = {2026,53}` ; `isoWeekOf(2027-01-04) = {2027,1}` ; `isoWeekOf(2021-01-01) = {2020,53}`.
  - `addWeeks({2026,53},1) = {2027,1}` ; `addWeeks({2027,1},-1) = {2026,53}` ; `addWeeks({2026,48},-48) = {2025,52}`.
  - `dateOf({2026,48},'w')` = 25/11/2026 ; `dateOf({2027,1},'m')` = 04/01/2027.
  - `displayWeekFor(samedi 28/11/2026) = {2026,49}` ; `displayWeekFor(vendredi 27/11/2026) = {2026,48}`.
  - `parseWeekKey('2026-W48')` ok ; `parseWeekKey('2026-W54')`, `parseWeekKey('abc')` → `null`.
  - `formatTime(480)='8h00'`, `formatTime(1125)='18h45'`.
- [ ] **Step 2:** FAIL. **Step 3:** Implémenter (calcul en dates locales, sans bibliothèque). **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: iso week helpers`.

### Task 4: Groupes

**Files:**
- Create: `src/domain/groups.ts`
- Test: `tests/unit/groups.test.ts`

**Interfaces:**
- Consumes: `RawGroupNode`, `RawTransversal` (Task 2).
- Produces: `type GroupKey = string` (`` `${promo}|${name}` ``), `type GroupNode = {key: GroupKey; promo: string; promoLabel: string; name: string; parent: GroupKey | null; children: GroupKey[]; depth: number}`, `type GroupIndex = {promos: {promo: string; label: string; root: GroupKey}[]; nodes: Map<GroupKey, GroupNode>; transversal: {key: GroupKey; promo: string; name: string; conflicts: GroupKey[]}[]}`, `buildGroupIndex(tree: RawGroupNode[], transversal: RawTransversal[]): GroupIndex`, `ancestorsOf(index, key): GroupKey[]` (lui-même inclus, du plus précis au plus large), `leavesOf(index, promo): GroupKey[]`, `relevantGroupKeys(index, key): Set<GroupKey>` (ancêtres + transversaux dont un `conflict` est dans les ancêtres ou les descendants de `key`).
- La promo d'un nœud = `promo` de la racine (pas son `name` : INFO a des racines nommées `CE`) ; `promoLabel` = `promotxt ?? promo`.

- [ ] **Step 1: Tests** (fixtures) :
  - RT : 3 promos `BUT1/BUT2/BUT3` ; `ancestorsOf('BUT1|1E') = ['BUT1|1E','BUT1|1G3','BUT1|BUT1']`.
  - INFO : `ancestorsOf('BUT2|1A') = ['BUT2|1A','BUT2|1','BUT2|12','BUT2|CE']` ; `'BUT1|1A'` et `'BUT2|1A'` sont deux nœuds distincts.
  - GIM : `relevantGroupKeys('GIM1|1A')` contient `'GIM1|1STA'` et pas `'GIM1|1EEM'`.
  - `leavesOf(RT,'BUT1')` = `1A..1F` (6 feuilles).
- [ ] **Step 2:** FAIL. **Step 3:** Implémenter. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: group tree index`.

### Task 5: Cours — normalisation, filtres, mise en colonnes

**Files:**
- Create: `src/domain/courses.ts`
- Test: `tests/unit/courses.test.ts`

**Interfaces:**
- Consumes: `RawScheduledCourse`, `RawConstraints`, `IsoWeek`, `DayRef`, `dateOf`, `GroupIndex`, `relevantGroupKeys`.
- Produces:
  - `type Course = {id: number; dept: string; week: IsoWeek; day: DayRef; date: Date; start: number; end: number; moduleAbbrev: string; moduleName: string; type: string; tutors: string[]; room: string | null; groups: {key: GroupKey; promo: string; name: string; structural: boolean}[]; graded: boolean}`
  - `normalizeCourses(raw: RawScheduledCourse[], dept: string, week: IsoWeek, constraints: RawConstraints): Course[]` — `tutors` = `[tutor, ...supp_tutor.username]` sans `null`, trié par `date` puis `start`.
  - `type Filter = {kind: 'group'; key: GroupKey; index: GroupIndex} | {kind: 'tutor'; username: string} | {kind: 'room'; name: string} | {kind: 'module'; abbrev: string}`
  - `filterCourses(courses: Course[], f: Filter): Course[]` — salle : correspondance exacte **ou** salle composée qui la contient (`'B112+B113'` matche `'B113'`).
  - `type PlacedCourse = Course & {col: number; cols: number}` ; `layoutDay(courses: Course[]): PlacedCourse[]` — cours qui se chevauchent côte à côte (`cols` = taille du groupe de chevauchement).
  - `courseTypeLabel(type: string): string` — `'TP240' → 'TP'`, `'TD' → 'TD'`, `'CM60' → 'CM'`, `'Examen'|'Exam45'|'ExamTP240' → 'Examen'`, sinon le type brut.

- [ ] **Step 1: Tests** :
  - RT s48 : 115 cours bruts → 115 `Course` ; premier cours `day 'tu'`, `start 480`, type `TP240` → `end 720`.
  - Type inconnu `'ZZZ'` → `end = start + 90`.
  - `room: null` → `room === null` ; `tutor: null` → `tutors` sans `null`.
  - GIM : cours `DEPT5` avec `supp_tutor MPH` → `tutors = ['DCO','MPH']`.
  - Filtre groupe RT `'BUT1|1E'` : contient le cours `R101` du mardi 8h00 (groupe `1E`), contient tout cours du groupe `1G3` ou `BUT1`, ne contient aucun cours du groupe `1A`.
  - Filtre salle `'B113'` matche un cours en `'B112+B113'`.
  - `layoutDay` : deux cours 8h00–9h30 et 9h00–10h30 → `cols 2`, colonnes 0 et 1 ; un cours isolé → `cols 1`.
  - `courseTypeLabel` : cas ci-dessus.
- [ ] **Step 2:** FAIL. **Step 3:** Implémenter. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: course normalization, filters and day layout`.

### Task 6: Départements et liens iCal

**Files:**
- Create: `src/domain/departments.ts`, `src/domain/ics.ts`
- Test: `tests/unit/departments.test.ts`, `tests/unit/ics.test.ts`

**Interfaces:**
- Produces: `type Department = {code: string; name: string}`, `parseDepartments(html: string): Department[]` (regex sur `goTo('/xx/edt/CODE/')">Nom<`), `loadDepartments(): Promise<Department[]>` (`FALLBACK_DEPARTMENTS` si erreur ou liste vide) ; `type IcsLinks = {groups: Map<string, string>; tutors: Map<string, string>; rooms: Map<string, string>}` (nom → URL absolue), `parseIcsLinks(html: string): IcsLinks` (`href="/fr/ics/RT/structural_group/538.ics">Copier ce lien - 1E<`).
- La page iCal n'indique pas la promo : pour un groupe, on prend le lien dont le nom correspond ; si plusieurs liens portent ce nom (INFO), on n'en propose aucun.

- [ ] **Step 1: Tests** : `home.html` → 5 départements dont `{code:'RT', name:'Réseaux et Télécommunications'}` ; HTML vide → `[]` ; `loadDepartments` avec fetch en erreur → `FALLBACK_DEPARTMENTS`. `ics-RT.html` → `groups.get('1E')` finit par `/fr/ics/RT/structural_group/538.ics`, `tutors.get('AAUP')` et `rooms.get('A011')` définis.
- [ ] **Step 2:** FAIL. **Step 3:** Implémenter. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: departments and ical links parsing`.

### Task 7: Préférences et routes

**Files:**
- Create: `src/state/prefs.ts`, `src/state/route.ts`
- Test: `tests/unit/prefs.test.ts`, `tests/unit/route.test.ts`

**Interfaces:**
- Produces:
  - `type Theme = 'auto'|'light'|'dark'` ; `type Prefs = {theme: Theme; compactWeek: boolean; dept: string | null; group: GroupKey | null; lastOfflineAt?: string}` ; `loadPrefs(): Prefs`, `savePrefs(p: Partial<Prefs>): void` — clé `betterflop:prefs`, chaque accès dans un try/catch, JSON invalide → valeurs par défaut (`theme 'auto'`, `compactWeek false`, reste `null`).
  - `type Route = {view: 'home'} | {view: 'timetable'; dept: string; target: Target; week: IsoWeek | null} | {view: 'lister'; dept: string; target: Target} | {view: 'settings'}` avec `type Target = {kind: 'group'; key: GroupKey} | {kind: 'tutor'; id: string} | {kind: 'room'; id: string} | {kind: 'module'; id: string}`.
  - `parseRoute(hash: string): Route`, `formatRoute(r: Route): string`. Formats : `#/RT/groupe/BUT1/1E/2026-W48`, `#/RT/prof/TVAL`, `#/RT/salle/E104/2026-W48`, `#/RT/module/R101`, `#/RT/lister/prof/TVAL`, `#/reglages`, `''` → home. Segments encodés avec `encodeURIComponent` (salles `B112+B113`). Hash invalide → `{view:'home'}`.

- [ ] **Step 1: Tests** : aller-retour `formatRoute(parseRoute(x)) === x` pour chaque format ci-dessus ; `parseRoute('#/n/importe/quoi')` → home ; salle `'B112+B113'` aller-retour intact ; `loadPrefs` avec `localStorage.getItem` qui lève → défauts ; JSON corrompu → défauts ; `savePrefs` fusionne.
- [ ] **Step 2:** FAIL. **Step 3:** Implémenter. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: prefs storage and hash routes`.

### Task 8: Thème, couleurs, tokens CSS

**Files:**
- Create: `src/domain/colors.ts`, `src/ui/styles.css`, `src/ui/useTheme.ts`
- Modify: `src/ui/App.tsx`, `index.html`
- Test: `tests/unit/colors.test.ts`

**Interfaces:**
- Produces: `moduleColor(abbrev: string, mode: 'light'|'dark'): {bg: string; fg: string; accent: string}` — teinte = hash stable du code → 0–359 ; clair : `bg hsl(h 45% 93%)`, `accent hsl(h 45% 45%)`, `fg` texte principal ; sombre : `bg hsl(h 25% 22%)`, `accent hsl(h 45% 65%)`. `useTheme(): {theme: Theme; mode: 'light'|'dark'; setTheme(t: Theme): void}` — pose `data-theme` sur `<html>`, met à jour `<meta name="theme-color">`.
- `styles.css` : tokens sur `:root` (`--bg`, `--surface`, `--text`, `--muted`, `--border`, `--accent` bleu ardoise unique), redéfinis sous `@media (prefers-color-scheme: dark)` avec `:root:not([data-theme="light"])` et sous `:root[data-theme="dark"]`. Police système, `font-variant-numeric: tabular-nums` pour les heures.

- [ ] **Step 1: Tests** : `moduleColor('R101','light')` identique sur deux appels ; `R101` et `R102` ont des teintes différentes ; contraste `fg`/`bg` ≥ 4.5 dans les deux modes pour 50 codes de `modules-RT.json` (petite fonction de luminance relative dans le test).
- [ ] **Step 2:** FAIL. **Step 3:** Implémenter. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: theme tokens and module colors`.

### Task 9: Vue emploi du temps (semaine, jour, détail)

**Files:**
- Create: `src/state/useWeekData.ts`, `src/ui/TopBar.tsx`, `src/ui/DayStrip.tsx`, `src/ui/DayView.tsx`, `src/ui/WeekGrid.tsx`, `src/ui/CourseCard.tsx`, `src/ui/Sheet.tsx`, `src/ui/CourseSheet.tsx`, `src/ui/TimetableView.tsx`
- Modify: `src/ui/App.tsx`
- Test: `tests/unit/timetable.test.tsx`

**Interfaces:**
- Consumes: Tasks 2–8.
- Produces: `useWeekData(dept: string, week: IsoWeek): {status: 'loading'|'ready'|'error'; courses: Course[]; error?: FlopError; retry(): void}` — charge `scheduledcourses` + `constraints` (une fois par dept), normalise, puis précharge `addWeeks(week, 1)` en tâche de fond. `TimetableView({route, groupIndex})`.
- Comportement :
  - Largeur < 768 px : `DayStrip` (jours de la semaine avec date ; jour courant mis en avant ; jour initial = aujourd'hui si dans la semaine, sinon lundi ; glisser à gauche/droite = jour suivant/précédent, au-delà du vendredi → semaine suivante) + `DayView`. Si `prefs.compactWeek` : `WeekGrid` compact.
  - Largeur ≥ 768 px : `WeekGrid` 5 colonnes (6–7 si des cours tombent le samedi/dimanche), axe horaire de 8h00 au dernier cours, cours positionnés par `start/end`, chevauchements via `layoutDay`.
  - `CourseCard` : heure début–fin, code + nom du module, type (`courseTypeLabel`), salle (`Distanciel` si `null`), prof(s), groupe(s) quand la vue n'est pas une vue groupe ; liseré et fond `moduleColor`. Badge « Évalué » si `graded`.
  - Toucher une carte → `CourseSheet` : nom complet du module, type, horaires, date, prof(s) avec nom complet (via `getTutors`), salle, groupes ; prof, salle et module sont des liens vers leur vue.
  - `TopBar` : libellé de la cible (ex. « BUT1 · 1E »), bouton pour changer, flèches ‹ ›, libellé « Semaine 48 · 23–27 nov. », bouton « Aujourd'hui » (`displayWeekFor(new Date())`), lien Lister quand la cible n'est pas un groupe.
  - États : chargement (squelettes), vide (« Pas de cours cette semaine »), erreur (« Impossible de joindre flopEDT » + « Réessayer »).

- [ ] **Step 1: Tests** (fetch mocké avec fixtures, `window.innerWidth = 375`) :
  - vue groupe RT `BUT1|1E` s48, jour mardi → une carte contient `R101` et `8h00`.
  - toucher la carte → la feuille affiche « Initiation aux réseaux informatiques » et un lien vers `#/RT/salle/E104/2026-W48`.
  - fetch renvoyant `[]` → texte « Pas de cours cette semaine ».
  - fetch en échec → « Impossible de joindre flopEDT » ; clic « Réessayer » avec fetch OK → cartes affichées.
  - bouton › → route `2026-W49`.
- [ ] **Step 2:** FAIL. **Step 3:** Implémenter. **Step 4:** PASS.
- [ ] **Step 5:** Vérif visuelle : `npm run dev`, captures Playwright à 375×812 et 1280×800 en clair et sombre (deviceScaleFactor 1), corriger ce qui déborde.
- [ ] **Step 6:** Commit `feat: timetable views`.

### Task 10: Choix du groupe et recherche prof / salle / module

**Files:**
- Create: `src/ui/GroupPicker.tsx`, `src/ui/EntitySearch.tsx`, `src/ui/HomeView.tsx`
- Modify: `src/ui/App.tsx`
- Test: `tests/unit/picker.test.tsx`

**Interfaces:**
- Consumes: `loadDepartments`, `buildGroupIndex`, `getTutors`, `getRooms`, `getModules`, `savePrefs`, `formatRoute`.
- Produces: `GroupPicker({onPick(dept: string, key: GroupKey): void})` dans une `Sheet` ; `EntitySearch({dept, onPick(target: Target): void})`.
- Comportement :
  - `GroupPicker` : étape 1 département (boutons pleine largeur, nom complet), étape 2 promo (boutons), étape 3 groupe : chaque niveau de l'arbre en rangée de « puces » (ex. RT : `1G1 1G2 1G3` puis `1A … 1F`), la feuille choisie valide ; on peut aussi choisir un nœud intermédiaire (TD) ou la promo entière. Bouton retour par étape. Choix → `savePrefs({dept, group})` + navigation.
  - `HomeView` (route home) : si `prefs.group` existe et est encore dans l'arbre → redirige vers sa vue semaine ; sinon ouvre `GroupPicker`. Sous la sélection : onglets « Prof », « Salle », « Module » → `EntitySearch`.
  - `EntitySearch` : champ texte, filtre insensible aux accents et à la casse sur nom/prénom/username (prof), nom (salle), code/nom (module) ; résultats en liste ; choix → vue semaine de la cible, avec un bouton « Lister ».

- [ ] **Step 1: Tests** :
  - parcours RT → BUT1 → 1G3 → 1E : `onPick('RT','BUT1|1E')`.
  - INFO → BUT2 : deux niveaux de puces avant `1A`, et le choix donne `'BUT2|1A'`.
  - `prefs.group = 'BUT9|ZZ'` (n'existe plus) → le sélecteur s'ouvre au lieu de rediriger.
  - recherche « aupeix » trouve `AAUP` ; « reseaux » trouve `R101` (accent ignoré) ; « e104 » trouve `E104`.
- [ ] **Step 2:** FAIL. **Step 3:** Implémenter. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: group picker and entity search`.

### Task 11: Lister

**Files:**
- Create: `src/ui/ListerView.tsx`, `src/domain/lister.ts`
- Modify: `src/ui/App.tsx`
- Test: `tests/unit/lister.test.ts`, `tests/unit/lister-view.test.tsx`

**Interfaces:**
- Consumes: `getScheduledCourses`, `getConstraints`, `normalizeCourses`, `filterCourses`, `getTutors`, `addWeeks`, `displayWeekFor`.
- Produces: `upcoming(courses: Course[], now: Date): Course[]` (garde ceux dont la fin est après `now`, triés) ; `departmentsForTarget(target: Target, dept: string, tutors: RawTutor[]): string[]` (prof → tous ses `departments`, sinon `[dept]`) ; `ListerView({route})`.
- Comportement : charge `LISTER_WEEKS` semaines à partir de la semaine courante pour chaque département concerné (en parallèle), filtre, `upcoming`, groupe par jour (« Mercredi 25 novembre »). Chaque ligne : heure, module (code + nom), type, salle, groupe(s), prof(s). Bouton « Charger 4 semaines de plus ». En-tête : « Prochains cours de … » + nombre de cours. Toucher une ligne → `CourseSheet`.

- [ ] **Step 1: Tests** :
  - `upcoming` avec `now` = mardi 24/11/2026 10h00 : exclut un cours du mardi 8h00–9h30 (déjà fini) ; inclut un cours du mardi 8h00–12h00 (fin 12h00 > 10h00) ; inclut tout cours du mercredi.
  - `departmentsForTarget` pour un prof avec `departments [RT, GIM]` → `['RT','GIM']`.
  - Vue : prof `TVAL`, fetch mocké → titre « Prochains cours de » + au moins une ligne `R102` ; clic « Charger 4 semaines de plus » déclenche les fetch des semaines +4…+7.
- [ ] **Step 2:** FAIL. **Step 3:** Implémenter. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: lister view`.

### Task 12: Réglages, hors ligne, e2e et README

**Files:**
- Create: `src/ui/SettingsView.tsx`, `public/icon.svg`, `tests/e2e/smoke.spec.ts`, `playwright.config.ts`, `README.md`
- Modify: `vite.config.ts` (vite-plugin-pwa), `src/api/client.ts`, `src/ui/App.tsx`
- Test: `tests/unit/offline.test.ts`, `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: tout ce qui précède.
- Produces:
  - `SettingsView` : thème (Auto / Clair / Sombre, contrôle segmenté), « Semaine compacte sur mobile » (interrupteur), département/groupe actuel + « Changer », lien iCal du groupe (via `parseIcsLinks`, bouton « Copier le lien »), lien vers flopEDT d'origine.
  - Hors ligne : `client.ts` écrit chaque réponse `scheduledcourses`/`constraints`/`tree`/`transversal` réussie dans `localStorage` (`betterflop:cache:<url>`, avec `savedAt`) ; en cas de `FlopError network`, renvoie la copie si elle existe, marquée `{stale: true, savedAt}` ; l'UI affiche « Hors ligne — données du JJ/MM HH:MM ». La PWA (`registerType: 'autoUpdate'`, manifeste nom « BetterFlop », `display: standalone`, couleurs du thème) met en cache l'app elle-même.
- [ ] **Step 1: Tests unitaires** : réponse OK puis fetch en échec réseau → données renvoyées avec `stale: true` ; échec réseau sans copie → `FlopError network`.
- [ ] **Step 2: Test e2e** (`page.route('https://flopedt.iut-blagnac.fr/**', …)` servi depuis les fixtures, appareil `iPhone 13`, sur `npm run build && vite preview`) : première visite → sélecteur → RT, BUT1, 1G3, 1E → carte `R101` visible ; recharger la page → arrive direct sur l'EDT de 1E ; passer en sombre dans Réglages → `html[data-theme=dark]` ; aucune largeur de document > largeur d'écran.
- [ ] **Step 3:** FAIL. **Step 4:** Implémenter. **Step 5:** `npm test` et `npm run e2e -- --trace off` → PASS.
- [ ] **Step 6:** README : à quoi sert le site, lancer en local, activer GitHub Pages (Settings → Pages → Source : GitHub Actions), d'où viennent les données.
- [ ] **Step 7:** Commit `feat: settings, offline cache, e2e smoke, readme`.
