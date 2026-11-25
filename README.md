# BetterFlop

Une autre façon d'afficher les emplois du temps flopEDT de l'IUT de Blagnac
(https://flopedt.iut-blagnac.fr), pensée d'abord pour le téléphone.

- Tous les départements (INFO, CS, GIM, RT, LPMA…), choix du groupe en trois touches, retenu pour la prochaine fois.
- Semaine par semaine : jour par jour sur mobile (on glisse pour changer de jour), grille de la semaine sur ordi.
- Vues par groupe, prof, salle ou module, et « Lister » : les prochains cours d'un prof, d'un module ou d'une salle.
- Thème clair, sombre ou automatique.
- Installable sur l'écran d'accueil ; la dernière version des semaines consultées reste lisible hors ligne.
- Lien iCal de ton groupe pour l'ajouter à l'agenda du téléphone.

Les données sont lues en direct depuis flopEDT par le navigateur (l'API de flopEDT
autorise les autres sites). BetterFlop n'a pas de serveur et ne stocke rien
ailleurs que dans ton navigateur.

## En local

```bash
npm install
```

```bash
npm run dev
```

Tests :

```bash
npm test
```

```bash
npm run e2e -- --trace off
```

## Mise en ligne sur GitHub Pages

Le workflow `.github/workflows/deploy.yml` teste, construit et publie le site à
chaque push sur `main`.

À faire une seule fois dans le dépôt GitHub : **Settings → Pages → Build and
deployment → Source : GitHub Actions**.

Le site est ensuite disponible sur `https://<utilisateur>.github.io/<dépôt>/`.

## Organisation du code

| Dossier | Rôle |
|---|---|
| `src/api/` | appels à flopEDT, cache mémoire et copie hors ligne |
| `src/domain/` | logique pure : semaines ISO, groupes, cours, couleurs, liens iCal |
| `src/state/` | préférences, routes (`#/RT/groupe/BUT1/1E/2026-W48`), chargement des données |
| `src/ui/` | composants Preact et styles |
| `tests/fixtures/` | vraies réponses flopEDT (sans e-mails) utilisées par les tests |

La base de flopEDT se change dans `src/config.ts`.
