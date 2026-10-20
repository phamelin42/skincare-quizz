# Produits Amazon sur le résultat (skincare-quizz)

## Objectif

Proposer, sous chaque type de produit du résultat, de vrais produits achetables sur Amazon.fr dont la composition correspond aux ingrédients évoqués par le profil. Les liens sont des liens d'affiliation Partenaires Amazon (tag `phamelin-21`).

## Décisions

- Décision de Phil (20/10/2026) : cette fonctionnalité **remplace** la règle « ne jamais recommander une marque » de `CLAUDE.md`. Des exemples nommés sont permis, à condition de figurer dans le catalogue validé.
- Les fiches Amazon.fr ne sont pas lisibles depuis l'environnement de l'agent (défi anti-robot). L'agent propose des produits à partir de la composition publiée par le fabricant ; **Phil ouvre chaque lien Amazon et valide** avant son intégration. Aucun lien ni ASIN n'est deviné.
- Aucun prix, aucune image, aucune note : Amazon interdit de les copier hors de son API.
- Pas d'API Amazon (PA-API), pas de serveur, pas de clé : le catalogue est un fichier du dépôt.

## Données

`src/app/routine/products.ts` :

```ts
export interface Product {
  readonly id: string;
  readonly name: string;
  readonly brand: string;
  /** Clé de la carte illustrée : `cleanser`, `serum`, `evening`, etc. */
  readonly card: string;
  /** Pour `serum` et `evening` : l’actif (clé d’`INGREDIENTS`) ; `null` pour les autres cartes. */
  readonly active: string | null;
  /** Pour `sunscreen` : l’indice de protection ; `null` ailleurs. */
  readonly spf: 30 | 50 | null;
  readonly asin: string;
  /** Liste INCI recopiée de la fiche du fabricant. */
  readonly inci: readonly string[];
  readonly sourceUrl: string;
  /** Date de validation du lien par Phil (AAAA-MM-JJ). */
  readonly validated: string;
}
```

- `AFFILIATE_TAG = 'phamelin-21'` est défini à un seul endroit ; le lien est `https://www.amazon.fr/dp/<asin>?tag=<tag>`.
- Un produit n'entre dans le fichier qu'après validation par Phil. Le catalogue est livré **vide** dans la première PR.

## Affichage (`result.html`)

- Sous chaque carte de produit : un bloc « Exemples sur Amazon » avec nom, marque, une ligne de composition et un lien.
- Liens `target="_blank"` `rel="sponsored noopener noreferrer"`, annoncés « (nouvel onglet) ».
- Carte sans produit validé : aucun bloc, ni vide ni factice.
- Dès qu'au moins un lien est affiché : mention visible « En tant que Partenaire Amazon, je réalise un bénéfice sur les achats remplissant les conditions requises. » et précision que ce sont des exemples dont la composition correspond, pas un classement.
- Le texte « Des types de produits, sans marque » de `result.html`, la meta description de `index.html` et la ligne du pied de page de `app.html` sont réécrits.
- L'encart « Ceci n'est pas un avis médical » reste.

## Garde-fous (`profile.spec.ts`, toutes les combinaisons de réponses)

- Carte `serum` ou `evening` : la liste INCI du produit contient au moins un INCI de son actif (`INGREDIENTS[active].inci`), et le produit n'est proposé que si l'actif est celui du profil.
- Cartes nettoyant et hydratant : la liste INCI contient au moins un des `labels` que la carte affiche pour ce profil.
- Carte écran solaire : le `spf` du produit (30 ou 50) est celui du profil ; pour un profil réactif, la liste INCI contient `Zinc Oxide` ou `Titanium Dioxide` (filtres minéraux, comme les `labels` de la carte).
- Un produit proposé à un profil réactif ne contient ni `Parfum` ni `Fragrance`.
- L'ASIN respecte `^[A-Z0-9]{10}$` ; chaque produit a une source en `https://` et une date ; les `id` sont uniques.
- Les textes ne contiennent aucune promesse de résultat : `catalogueDefects` relit le nom, la marque et chaque INCI, et les deux mentions affichées, avec la liste `PROMISE` de `products.ts`.
- La comparaison des INCI ignore la casse et une précision finale entre `(…)` ou `[…]` (`Titanium Dioxide [nano]` compte comme `Titanium Dioxide`). L'`active` d'un `serum` ou d'un `evening` est limité aux clés de `SERUM_NAMES` et `EVENING_TITLES`, les seules que le profil demande. Le bloc d'exemples est projeté dans l'emplacement `actions` de la carte, après les pastilles de l'étiquette.
- Le tag d'affiliation apparaît une fois dans chaque lien, et seulement `amazon.fr` est un hôte de lien produit.

## Règles réécrites

`CLAUDE.md` (« Le projet »), `index.html`, `app.html`, `result.html`, `README.md` s'il mentionne « sans marque ».

## Livraison

1. PR « Structure » : types, affichage, mention, tests, règles. Catalogue vide, donc rien de visible en production.
2. PR « Catalogue » : tableau (produit, composition, source, lien à contrôler) remis à Phil ; seuls les produits validés sont ajoutés.

Quality gates avant chaque PR : `lint`, `typecheck`, `test`, `build`, `e2e` (axe Jour/Nuit sur l'état avec produits), `format:check`.

## Hors périmètre

PA-API, prix et images Amazon, mesure Umami des clics (le site n'est pas encore enregistré), modification de Fuda.

## À la charge de Phil

- Contrôler chaque lien Amazon du tableau.
- Déclarer le site dans le compte Partenaires Amazon.
- Confirmer le libellé de la mention légale.
