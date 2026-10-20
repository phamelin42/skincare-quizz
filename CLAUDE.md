# Skincare Quizz

Site Angular 22 construit avec la bibliothèque **Fuda** (`design-system-fuda`). Textes de l'interface, documentation et messages de commit en français.

## Le projet

Questionnaire de routine de soin, d'après la maquette validée par Philippe (https://claude.ai/artifact/7tXzRcTiFjYA4GBiYTryAC) : 10 questions à choix unique (peau, habitudes, temps disponible), puis un écran de résultat avec le type de peau évoqué, les ingrédients à repérer, une routine matin et soir et des types de produits. Pas de score : aucune réponse n'est juste ou fausse.

- Le contenu est rédigé à la main et vérifié : un fait douteux ne vaut rien. Sources fiables uniquement (dermatologie, étiquetage, organismes de santé).
- Aucun conseil médical, aucun diagnostic (« vos réponses évoquent… », jamais « vous avez… »), aucune promesse de résultat ; ne jamais recommander une marque. L'encart « Ceci n'est pas un avis médical » reste sur le résultat.
- Rien n'est enregistré : les réponses vivent en mémoire, dans `QuizService`.

## Commandes

Node ≥ 22.22.3 (exigé par Angular 22 ; `.nvmrc` : 24). Site : skincare-quizz.phamelin.fr.

| Commande                             | Rôle                                                       |
| ------------------------------------ | ---------------------------------------------------------- |
| `npm start`                          | Serveur de développement                                   |
| `npm test`                           | Tests unitaires (Vitest via `ng test`)                     |
| `npm run lint` / `npm run typecheck` | ESLint (angular-eslint) / tsc sur l'appli et les specs     |
| `npm run build`                      | Build de production (`dist/skincare-quizz/browser`)        |
| `npm run e2e`                        | Playwright sur ce build : parcours, clavier, axe Jour/Nuit |
| `npm run format` / `format:check`    | Prettier                                                   |

Une tâche est terminée quand `lint`, `typecheck`, `test` et `build` sont verts, et `e2e` si l'interface, le clavier ou le focus changent.

## Façon de travailler

- Branche par défaut `main`. On travaille sur une branche et une pull request, jamais directement sur `main` : un push sur `main` déclenche le déploiement Vercel.
- Messages de commit en français, à l'impératif court (« Ajoute… », « Corrige… »), un sujet par commit.
- Les noms de branche ne sont pas des `claude/<nom>` générés : un nom parlant (`ajout-questions`, `fix-focus`).
- Le dépôt est public : aucun secret, aucune clé API, aucune donnée personnelle dans le code, les tests ou les messages de commit.
- Les identifiants de dépôt, de domaine et de projet Vercel sont dans le dépôt `infra` (`projects.json`), pas ici.

## Structure

- `src/app/` : un dossier par composant avec `.ts`, `.html`, `.scss` ; `app` assemble la page et affiche l'écran du moment (`home`, `question`, `analysis`, `result`). Les données et la logique métier vont dans des services à signaux, testés à part.
- `src/app/routine/` : questions (`questions.ts`), textes (`content.ts`), calcul du profil, des produits et de la routine (`profile.ts`, fonctions pures), parcours (`quiz.service.ts`). `profile.spec.ts` parcourt toutes les combinaisons de réponses.
- `e2e/` : Playwright (build de production servi par `http-server` sur le port 4300).
- `public/` : fichiers servis tels quels (icônes d'onglet).

## Conventions Angular

Les mêmes que Fuda. Composants standalone, `OnPush` et zoneless par défaut (on ne les répète pas), aucun NgModule. Signaux partout (`input()`, `computed()`, `viewChild()`), pas de `@Input`/`@Output`. Contrôle de flux natif (`@if`, `@for`, `@defer`). `host: {}`, pas de `@HostBinding`. `inject()` plutôt que le constructeur. Sélecteurs préfixés `app`. Template et styles dans des fichiers séparés (`templateUrl`, `styleUrl`), `ViewEncapsulation.None`, classes `app-*`.

- Un contenu projeté ne se met pas dans un `@if` à plusieurs nœuds racines (NG8011) : on garde les emplacements `slot=…` en dehors des `@if` et on varie le texte avec une expression.
- `viewChild('x')` sur un `button[fdButton]` donne le composant `FdButton`, pas l'élément : lire avec `{ read: ElementRef }`.
- Les boutons Fuda en `aria-disabled="true"` sont grisés par Fuda ; on les utilise plutôt que `disabled`, qui retirerait le focus. Playwright n'attend pas un élément `aria-disabled` : `click({ force: true })` dans les tests.
- Les surcharges de style d'un composant Fuda doivent être plus spécifiques que lui (`.app-form .app-submit`), car l'ordre d'insertion des feuilles dépend du premier rendu.
- Un état qui change hors d'un événement Angular (observable, minuterie) passe par un signal.

## Style et accessibilité

Uniquement des custom properties issues des tokens Fuda (couleur, espacement, rayon, police : `--space-*`, `--ink`, `--font-display`…), aucune valeur en dur. Thème Jour par défaut, Nuit par `data-theme="dark"` posé par `FdThemeService` sur choix de l'utilisateur ; jamais de `prefers-color-scheme`. Mouvement : celui de Fuda, `prefers-reduced-motion` respecté. Un `.scss` de composant pèse au plus 4 Ko (budget bloquant).

WCAG 2.2 AA : focus visible, cibles de 44 px, libellé de champ visible, texte à 4.5:1 dans les deux thèmes, jamais la couleur seule pour porter une information. `e2e/accueil.spec.ts` passe axe en Jour et en Nuit : l'étendre à chaque nouvelle page ou état.

## Obligatoire sur tout site

- **Une icône d'onglet** (`favicon`) : `public/favicon.svg`, `public/favicon.ico` (16, 32 et 48 px) et `public/apple-touch-icon.png` (180 px), déclarés dans `src/index.html`. Un site sans icône d'onglet n'est pas terminé : l'icône par défaut d'Angular n'est pas acceptable. `e2e/accueil.spec.ts` vérifie que les fichiers répondent. Le pictogramme est l'emblème sakura de Fuda (couleurs du thème Jour) ; `favicon.ico` et `apple-touch-icon.png` sont rendus depuis `favicon.svg` par Chromium.
- **Mesure d'audience** : Umami (`analytics.patternreader.com`), un site enregistré par application. Ne jamais recopier le `data-website-id` d'un autre projet ; l'ajouter à `src/index.html` seulement une fois le site enregistré dans Umami.

## Dépendance Fuda

Installée depuis GitHub à un commit précis de `main` (`"fuda": "github:phamelin42/design-system-fuda#<commit>"`) ; `prepare` construit la lib, ce qui rend l'installation plus longue. Pour la mettre à jour, prendre le dernier commit de `main` de Fuda. Si une icône, une variante ou un composant manque, on l'ajoute dans Fuda, pas ici.

## Versions

Angular 22 et ses outils sont à jour au moment de la création. TypeScript reste en `~6.0` : Angular 22 exige `>=6.0 <6.1`, la série 7 n'est pas encore compatible. Avant de monter une version majeure, vérifier la compatibilité de `@angular/build` et de `typescript-eslint`.
