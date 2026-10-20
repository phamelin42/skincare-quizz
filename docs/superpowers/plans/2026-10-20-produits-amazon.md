# Produits Amazon sur le résultat (skincare-quizz) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afficher sous chaque carte de produit du résultat des exemples réels vendus sur Amazon.fr (liens d'affiliation), tirés d'un catalogue validé par Phil, livré vide dans cette PR.

**Architecture:** Un module de données et de règles pures (`products.ts`) est injecté dans `QuizService` par un jeton, qui ajoute `examples` à chaque carte. Un petit composant `app-examples` affiche le bloc ; `result.html` affiche la mention d'affiliation quand au moins un exemple existe.

**Tech Stack:** Angular 22 (standalone, signaux, zoneless), Vitest via `ng test`, Playwright, Fuda (`fuda`), Prettier.

**Spec:** `docs/superpowers/specs/2026-10-20-produits-amazon-design.md`

## Global Constraints

- Branche `claude/amazing-maxwell-it70ox` (imposée par la session) ; jamais de push sur `main`. Commits en français, à l'impératif court, un sujet par commit, terminés par les lignes `Co-Authored-By` et `Claude-Session` données par la session.
- Node ≥ 22.22.3 (`.nvmrc` : 24) : `source /opt/nvm/nvm.sh && nvm use 24` si `node -v` est 22.22.0. Ne jamais lancer `playwright install` ; Chromium est dans `/opt/pw-browsers`.
- Tag d'affiliation `phamelin-21`, défini à un seul endroit (`AFFILIATE_TAG`). Lien : `https://www.amazon.fr/dp/<asin>?tag=phamelin-21`.
- Liens produit : `target="_blank"`, `rel="sponsored noopener noreferrer"`, texte « (nouvel onglet) » dans un `.fd-sr`.
- Aucun prix, aucune image, aucune note Amazon. Aucun ASIN ni lien deviné : le catalogue reste `[]` dans cette PR.
- Mention d'affiliation, texte exact : « En tant que Partenaire Amazon, je réalise un bénéfice sur les achats remplissant les conditions requises. » (Phil confirmera le libellé.)
- Aucune valeur en dur dans les styles (tokens Fuda uniquement) ; un `.scss` de composant pèse au plus 4 Ko (`result.scss` est déjà à 3 117 octets : le style du bloc va dans un nouveau composant).
- Typographie française : espace insécable avant `: ; ? !`, apostrophe typographique (’) dans les textes visibles.
- Prettier : `npx prettier --check <fichiers touchés>` avant chaque push.

## Review Focus

- Catalogue vide (état de production de cette PR) : aucune carte n'affiche de bloc, aucune mention d'affiliation, aucune erreur.
- Profil réactif : un produit parfumé (`Parfum`, `Fragrance`, `Parfum (Fragrance)`) n'est jamais proposé, quelle que soit la casse.
- Écran solaire : un produit SPF 30 n'est jamais proposé à un profil SPF 50, et un filtre chimique n'est jamais proposé à un profil réactif.
- Un produit dont l'`active` ne correspond pas à l'actif du profil (sérum, soir) n'est jamais proposé.
- Un ASIN mal formé, une source en `http://`, un `id` en double ou une carte inconnue sont signalés par `catalogueDefects` (contrôle négatif testé).

---

### Task 1: Module `products.ts` (types, lien, règles, jeton)

**Files:**

- Create: `src/app/routine/products.ts`
- Test: `src/app/routine/products.spec.ts`

**Interfaces:**

- Consumes: `ProductCard`, `Profile` (`./profile`), `INGREDIENTS` (`./content`).
- Produces (tâches 2 et 3 s'appuient dessus) :
  - `export const AFFILIATE_TAG = 'phamelin-21'`
  - `export const AFFILIATE_NOTICE: string` (texte exact des contraintes) et `export const EXAMPLES_NOTE: string` = « Exemples dont la composition correspond aux repères ci-dessus, présentés sans classement. »
  - `export interface Product { id; name; brand; card: string; active: string | null; spf: 30 | 50 | null; asin; inci: readonly string[]; sourceUrl; validated }` (tous `readonly`, `validated` au format `AAAA-MM-JJ`)
  - `export const CATALOGUE: readonly Product[] = []`
  - `export const PRODUCT_CATALOGUE: InjectionToken<readonly Product[]>` (`providedIn: 'root'`, `factory: () => CATALOGUE`)
  - `export function amazonUrl(asin: string): string`
  - `export function catalogueDefects(catalogue: readonly Product[]): string[]` (un message par défaut, `[]` si tout est valide)
  - `export function examplesFor(card: ProductCard, profile: Profile, catalogue: readonly Product[]): Product[]` (au plus 3)

- [ ] **Step 1: Écrire `products.spec.ts` (échec attendu)**

Un `fixture()` construit des produits valides par carte (`serum` avec `active: 'niacinamide'`, `evening`, `cleanser`, `moisturiser`, `sunscreen` avec `spf`), avec des ASIN de test `B0TESTTEST1`… Tests, par nom :
`amazonUrl` renvoie `https://www.amazon.fr/dp/B0TESTTEST1?tag=phamelin-21` · `CATALOGUE` est vide dans cette PR (`expect(CATALOGUE).toEqual([])`, retiré en tâche catalogue) · `catalogueDefects` renvoie `[]` pour la fixture · `catalogueDefects` signale séparément : ASIN `b0test` ; ASIN à 11 caractères ; `sourceUrl` en `http://` ; date `2026/10/20` ; `id` en double ; `card` inconnue (`makeupRemover` inclus : seules `serum`, `evening`, `cleanser`, `moisturiser`, `sunscreen` sont permises) ; `serum` sans `active` ; `active` hors `INGREDIENTS` ; `sunscreen` sans `spf` ; INCI d'un `serum` ne contenant aucun INCI de `INGREDIENTS[active].inci` (comparaison insensible à la casse) · `examplesFor` : ne renvoie que les produits de la clé de la carte ; sérum/soir filtrés par `profile.serum`/`profile.evening` ; écran solaire filtré par `profile.spf` ; profil réactif : exclut `Parfum`, `Fragrance`, `PARFUM (FRAGRANCE)` ; profil réactif et écran solaire : exige `Zinc Oxide` ou `Titanium Dioxide` ; nettoyant/hydratant : exige au moins un des `card.labels` (casse ignorée) ; cap de 3 ; ordre du catalogue conservé ; `[]` avec un catalogue vide.
Obtenir `ProductCard` et `Profile` avec `analyse`/`products` de `./profile` à partir d'un `answers()` local (copier l'aide du haut de `profile.spec.ts`).

- [ ] **Step 2: Lancer et constater l'échec**

Run: `npx ng test --no-watch --include='src/app/routine/products.spec.ts'`
Expected: FAIL (module `./products` introuvable).

- [ ] **Step 3: Implémenter `products.ts`**

Signatures de l'interface ci-dessus. `examplesFor` applique, dans l'ordre : même `card.key` ; `active` égal à `profile.serum` (carte `serum`) ou `profile.evening` (carte `evening`) ; `spf` égal à `profile.spf` (carte `sunscreen`) ; profil réactif → pas d'INCI commençant par `parfum` ou `fragrance` (insensible à la casse) ; profil réactif et `sunscreen` → INCI contenant `Zinc Oxide` ou `Titanium Dioxide` ; cartes `cleanser`/`moisturiser` → au moins un `card.labels` dans l'INCI ; puis `.slice(0, 3)`. Commentaire sur le pourquoi : le filtre applique les règles de profil, `catalogueDefects` celles qui ne dépendent pas du profil.

- [ ] **Step 4: Relancer**

Run: la commande de l'étape 2. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/routine/products.ts src/app/routine/products.spec.ts
git commit -m "Ajoute le catalogue de produits et ses règles"
```

---

### Task 2: Exemples dans `QuizService` et garde-fous sur toutes les réponses

**Files:**

- Modify: `src/app/routine/quiz.service.ts:2,37-47`
- Modify: `src/app/routine/quiz.service.spec.ts`
- Modify: `src/app/routine/profile.spec.ts` (nouveau `describe('exemples de produits')`)

**Interfaces:**

- Consumes: `PRODUCT_CATALOGUE`, `examplesFor`, `Product` (tâche 1).
- Produces: `QuizService.result()` renvoie `products: (ProductCard & { examples: Product[] })[]`.

- [ ] **Step 1: Écrire les tests (échec attendu)**

`quiz.service.spec.ts` : avec le catalogue par défaut, chaque `result().products[i].examples` vaut `[]` ; avec `{ provide: PRODUCT_CATALOGUE, useValue: [fixture sérum niacinamide] }` et des réponses menant à `profile.serum === 'niacinamide'`, la carte `serum` a 1 exemple et les autres 0. Réutiliser la façon dont le fichier atteint l'écran `result` (lire ses tests existants).
`profile.spec.ts`, test « n'affiche que des exemples cohérents avec le profil, pour toutes les réponses » : parcourir `everyAnswers()`, ne traiter qu'une fois chaque profil distinct (`JSON.stringify(profile)` dans un `Set`), appeler `examplesFor` avec une fixture couvrant sérum (chaque clé de sérum), soir (chaque clé du soir), nettoyant (avec et sans `Zinc PCA`), hydratant, écran solaire 30 et 50, minéral ou non, parfumé ou non. Pour chaque exemple affiché, contrôles réécrits indépendamment du filtre (`inci.join('|').toLowerCase()`) : sérum/soir → contient un INCI de l'actif du profil ; réactif → ne contient ni `parfum` ni `fragrance` ; écran solaire → `spf` du profil et, si réactif, un filtre minéral ; nettoyant/hydratant → contient un `label` de la carte. Un seul `expect(defects).toEqual([])`. Test négatif : une fixture hydratant sans `Glycerin` ni aucun label n'est jamais affichée. Ajouter `expect(catalogueDefects(CATALOGUE)).toEqual([])`.

- [ ] **Step 2: Constater l'échec**

Run: `npx ng test --no-watch --include='src/app/routine/*.spec.ts'` — Expected: FAIL (`examples` indéfini).

- [ ] **Step 3: Brancher le service**

Dans `QuizService`, `private readonly catalogue = inject(PRODUCT_CATALOGUE)` et `products: products(profile).map((card) => ({ ...card, examples: examplesFor(card, profile, this.catalogue) }))`. Importer `inject`.

- [ ] **Step 4: Relancer** — même commande. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/routine/quiz.service.ts src/app/routine/quiz.service.spec.ts src/app/routine/profile.spec.ts
git commit -m "Associe des exemples de produits aux cartes du résultat"
```

---

### Task 3: Composant `app-examples` et mention d'affiliation

**Files:**

- Create: `src/app/examples/examples.ts`, `examples.html`, `examples.scss`, `examples.spec.ts`
- Modify: `src/app/result/result.ts`, `src/app/result/result.html`
- Test: `src/app/result/result.spec.ts` (nouveau)

**Interfaces:**

- Consumes: `Product`, `amazonUrl`, `AFFILIATE_NOTICE`, `EXAMPLES_NOTE`, `PRODUCT_CATALOGUE` (tâches 1-2).
- Produces: `Examples` (`selector: 'app-examples'`, `products = input.required<readonly Product[]>()`, hôte `display: block`) ; `Result.view()` gagne `affiliate: boolean` (vrai si une carte a au moins un exemple) ; constantes exposées au template via le composant.

- [ ] **Step 1: Écrire les tests (échec attendu)**

`examples.spec.ts` : avec 2 produits, 2 `<a>` dont `href` = `amazonUrl(asin)`, `target="_blank"`, `rel` contenant `sponsored`, `noopener` et `noreferrer` ; chaque lien contient un `.fd-sr` « (nouvel onglet) » ; le nom et la marque sont affichés ; la composition montre les 8 premiers INCI, suivis de « … » seulement s'il y en a davantage ; aucun `<img>` ni prix.
`result.spec.ts` : (a) catalogue par défaut, résultat atteint : aucun `app-examples` et aucun texte « Partenaire Amazon » ; (b) avec un catalogue fixture qui donne un exemple : `app-examples` présent sous la bonne carte, la mention `AFFILIATE_NOTICE` et `EXAMPLES_NOTE` visibles une seule fois ; l'encart « Ceci n’est pas un avis médical » reste. Mettre le service en état `result` comme le fait `quiz.service.spec.ts`.

- [ ] **Step 2: Constater l'échec**

Run: `npx ng test --no-watch --include='src/app/{examples,result}/*.spec.ts'` — Expected: FAIL.

- [ ] **Step 3: Implémenter**

`Examples` suit le patron des autres composants (`templateUrl`, `styleUrl`, `ViewEncapsulation.None`, classe `app-examples`). Gabarit : un `<p class="app-label">Exemples sur Amazon</p>` puis une `<ul>` ; par produit, un `<a>` avec les attributs ci-dessus, la marque, la ligne « Composition (début de la liste) : … ». Style avec tokens (`--space-*`, `--ink`, `--sakura-deep`, `--focus-ring` comme dans `result.scss`), cible de lien d'au moins 44 px, soulignement conservé (pas la couleur seule). Dans `result.html`, après `.app-labels` de chaque carte produit : `@if (product.examples.length > 0) { <app-examples [products]="product.examples" /> }` (un seul nœud racine : pas de NG8011). Sous la grille, `@if (v.affiliate) { <p class="app-note">{{ notice }} {{ note }}</p> }` avec `AFFILIATE_NOTICE` et `EXAMPLES_NOTE`. Importer `Examples` dans `Result.imports`.

- [ ] **Step 4: Relancer** — Expected: PASS ; `npx ng build` : aucun avertissement de budget `examples.scss`.

- [ ] **Step 5: Commit**

```bash
git add src/app/examples src/app/result
git commit -m "Affiche les exemples de produits et la mention d'affiliation"
```

---

### Task 4: Réécrire la règle « sans marque »

**Files:**

- Modify: `CLAUDE.md:10`, `README.md:3`, `src/index.html:10`, `src/app/app.html:25-26`, `src/app/result/result.html:85-86`
- Test: `src/app/app.spec.ts` (si elle lit le pied de page) ; sinon aucun nouveau test

**Interfaces:** aucune.

- [ ] **Step 1:** `grep -rn "marque" CLAUDE.md README.md src e2e` ; retenir chaque occurrence qui dit « sans marque » ou « aucune marque » (ignorer `app-brand`). Si un test lit l'ancien texte, l'inverser pour le nouveau.
- [ ] **Step 2: Réécrire** :
  - `CLAUDE.md` : « ne jamais recommander une marque » devient « ne nommer un produit que s'il figure dans `src/app/routine/products.ts` : composition lue chez le fabricant, lien Amazon validé par Phil, aucun prix, aucun classement, aucune promesse » ; ajouter à « Structure » `products.ts` et `examples/`, et mentionner les liens d'affiliation (`phamelin-21`) dans « Le projet ».
  - `README.md` et `src/index.html` : retirer « , sans marque ».
  - `app.html` : « Aucune marque n’est recommandée. » devient « Les produits cités sont des exemples dont la composition correspond, pas des recommandations. »
  - `result.html` : « Des types de produits, sans marque. Comparez… » devient « Des types de produits. Comparez les listes d’ingrédients de ceux que vous trouvez en magasin. »
- [ ] **Step 3:** `npx prettier --check CLAUDE.md README.md src/index.html src/app/app.html src/app/result/result.html` ; Expected: « All matched files use Prettier code style! ».
- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md README.md src/index.html src/app/app.html src/app/result/result.html
git commit -m "Remplace la règle « sans marque » par le catalogue validé"
```

---

### Task 5: Quality gates, push, PR

**Files:** aucun.

- [ ] **Step 1:** `npm ci` si `node_modules` manque (attendre la fin, ne pas le lancer en arrière-plan).
- [ ] **Step 2:** lire `.github/workflows/*.yml` et lancer toutes les étapes qu'il liste : `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run e2e` (avec `PW_CHROMIUM=/opt/pw-browsers/chromium` ou la variable que lit `playwright.config.ts`), `npm run format:check`. Expected: tout vert. Une sortie rouge se corrige à la cause, sans désactiver de règle.
- [ ] **Step 3:** vérifier qu'aucun fichier non listé n'est modifié (`git status`).
- [ ] **Step 4:** pousser (`git push -u origin claude/amazing-maxwell-it70ox`), vérifier qu'aucune PR n'existe déjà pour la branche, ouvrir la PR vers `main` avec : ce qui change, critères cochés honnêtement, poids du bundle avant/après, « catalogue vide, rien de visible en production », e2e axe avec produits repoussé à la PR « Catalogue » (impossible tant que le bundle n'a aucun produit), points à relire, pièces restant à Phil. Puis `subscribe_pr_activity`.

## Vérification de la PR « Catalogue » (suite, hors de ce plan)

Tableau (produit, INCI, source, lien) remis à Phil ; ajout des seuls produits validés dans `CATALOGUE` ; retirer `expect(CATALOGUE).toEqual([])` ; e2e axe Jour/Nuit sur un résultat qui affiche des produits.
