# BetterFlop — design

Date : 2026-11-25

## Intention

Remplacer l'affichage de l'emploi du temps flopEDT de l'IUT de Blagnac
(`https://flopedt.iut-blagnac.fr/fr/edt/RT/`) par un site plus agréable,
surtout sur mobile. Les données restent celles de flopEDT, lues en direct :
seul l'affichage change.

Problèmes actuels à régler : choix du groupe pénible sur mobile, lenteur,
couleurs agressives.

## Objectifs

- Mobile d'abord : utilisable à une main, rapide, sans zoom.
- Choix année / groupe simple et mémorisé (on ouvre le site, on voit son EDT).
- Affichage semaine par semaine, navigation semaine précédente / suivante / aujourd'hui.
- Tous les départements de l'IUT : on choisit d'abord son département
  (RT, GEII, INFO…, liste lue depuis flopEDT), puis année / groupe.
- Mode clair / sombre, réglable à la main (auto par défaut selon le téléphone).
- Couleurs sobres : palette douce et désaturée, lisible dans les deux modes.
- Toutes les vues de flopEDT en lecture : par groupe, par prof, par salle,
  par module (ressource), avec le détail d'un cours (module, type CM/TD/TP,
  prof, salle, groupe, horaires).
- Rubrique **Lister** : on choisit un prof, un module ou une salle et on
  voit la liste de ses prochains cours (date, heure, salle, groupe, prof),
  sur plusieurs semaines.

## Hors périmètre

- Tout ce qui demande d'être connecté à flopEDT (saisie des dispos, modifs
  d'EDT, préférences profs).
- Comptes utilisateurs, notifications push.

## Ce qui serait un échec

- Plus lent que flopEDT ou qui fige sur mobile.
- Données fausses ou en retard par rapport à flopEDT.
- Interface chargée ou criarde : on veut sobre.

## Contraintes

- Hébergement : GitHub Pages, donc site 100 % statique, aucun serveur.
- Le navigateur appelle flopEDT directement (choix de l'utilisateur,
  validé : d'autres sites tiers l'ont déjà fait).
- Le container de dev n'a pas encore accès à `flopedt.iut-blagnac.fr` :
  l'accès doit être ouvert avant de coder la partie données.

## Approches envisagées

| Approche | Avantage | Inconvénient |
|---|---|---|
| **A. Direct navigateur → flopEDT** (retenue) | temps réel, 0 €, rien à maintenir | dépend de l'autorisation CORS de flopEDT |
| B. GitHub Pages + relais Cloudflare Worker | cache, marche même si CORS bloqué | une pièce en plus à déployer |
| C. Copie des données par GitHub Actions | aucun souci CORS | 15–30 min de retard, pas du temps réel |

Choix : **A**, décidé par l'utilisateur. L'adresse de base des données est
un seul réglage dans le code ; si flopEDT bloquait un jour les requêtes du
navigateur, on bascule sur B sans toucher au reste.

## Comment c'est fait (mes choix, à corriger si besoin)

- **Stack** : Vite + TypeScript + Preact (bibliothèque d'interface de ~4 ko,
  rapide sur mobile). Déploiement automatique sur GitHub Pages par une
  GitHub Action à chaque push sur la branche principale.
- **Installable** : manifeste PWA pour « Ajouter à l'écran d'accueil »,
  et la dernière semaine consultée gardée en cache pour l'ouvrir même
  sans réseau (avec mention « hors ligne, données du JJ/MM HH:MM »).
- **Données** : lecture de l'API JSON de flopEDT (cours planifiés par
  semaine, groupes, profs, salles, modules). Les endpoints exacts sont à
  confirmer en premier une fois l'accès réseau ouvert. Cache mémoire par
  semaine ; la semaine suivante est préchargée pour que la navigation soit
  instantanée.
- **Mémorisation** : groupe choisi, thème, dernière vue gardés dans le
  navigateur (localStorage). L'URL reflète la vue
  (`#/RT/groupe/BUT1/1E/2026-W48`) pour pouvoir partager un lien.

### Écrans

1. **Accueil / EDT** — barre du haut : groupe actuel (touchable pour
   changer), flèches semaine, bouton « aujourd'hui ».
   - *Mobile* : bandeau des jours de la semaine (Lu Ma Me Je Ve, jour
     courant mis en avant), on touche un jour ou on glisse pour passer au
     suivant ; les cours du jour s'affichent en cartes sur une colonne
     horaire. Option « semaine compacte » : les 5 jours côte à côte en
     mini-grille.
   - *Ordinateur* : grille semaine classique 5 colonnes.
2. **Choix du groupe** — feuille qui monte du bas sur mobile : on choisit
   le département, puis l'année (BUT1 / BUT2 / BUT3), puis le groupe en gros boutons
   (TD, puis TP). Pas de liste déroulante minuscule. Recherche rapide
   possible.
3. **Vues prof / salle / module** — même affichage que l'EDT, mais filtré
   sur un prof, une salle ou un module, choisi via une recherche avec
   autocomplétion.
4. **Lister** — on choisit un prof, un module ou une salle ; liste
   chronologique des prochains cours, groupés par jour, sur les N semaines
   à venir (4 par défaut, bouton « charger plus »).
5. **Détail d'un cours** — on touche un cours : module (nom complet), type,
   prof (touchable → vue prof), salle (touchable → vue salle), groupe(s),
   horaires.
6. **Réglages** — thème clair / sombre / auto.

### Design

- Fond neutre, texte très lisible, une seule couleur d'accent.
- Couleur par module mais en teintes pastel (clair) / sourdes (sombre),
  générées à partir du nom du module pour rester stables d'une semaine à
  l'autre.
- Gros éléments touchables (≥ 44 px), aucune animation lourde.

## Laissé au constructeur

- Les endpoints exacts de l'API flopEDT et la forme des données (à
  explorer en premier avec l'accès réseau).
- La structure exacte des groupes RT (BUT1/2/3, TD, TP) telle que
  renvoyée par flopEDT.
- Le détail visuel (typo, palette exacte) dans l'esprit sobre ci-dessus.
