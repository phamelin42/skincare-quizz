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
  /** Pour `moisturiser` : crème riche ou légère, comme `profile.rich` ; `null` ailleurs. */
  readonly rich: boolean | null;
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
- Aucune mention d'affiliation ni précision sur les exemples n'est affichée : Phil l'a retirée le 21/10/2026 (elle figurait au départ : « En tant que Partenaire Amazon, je réalise un bénéfice sur les achats remplissant les conditions requises. »).
- Le texte « Des types de produits, sans marque » de `result.html`, la meta description de `index.html` et la ligne du pied de page de `app.html` sont réécrits.
- L'encart « Ceci n'est pas un avis médical » reste.

## Garde-fous (`profile.spec.ts`, toutes les combinaisons de réponses)

- Carte `serum` ou `evening` : la liste INCI du produit contient au moins un INCI de son actif (`INGREDIENTS[active].inci`), et le produit n'est proposé que si l'actif est celui du profil.
- Cartes nettoyant et hydratant : la liste INCI contient au moins un des `labels` que la carte affiche pour ce profil.
- Carte écran solaire : le `spf` du produit (30 ou 50) est celui du profil ; pour un profil réactif, la liste INCI contient `Zinc Oxide` ou `Titanium Dioxide` (filtres minéraux, comme les `labels` de la carte) **et aucun** des filtres chimiques de `CHEMICAL_UV_FILTERS` : les écrans hybrides sont exclus, seul un écran uniquement minéral est proposé.
- Un produit proposé à un profil réactif ne contient ni `Parfum` ni `Fragrance`, ni huile essentielle (`ESSENTIAL_OIL` : mention littérale ou plante aromatique dont l'entrée finit par « Oil » ; les huiles végétales comme tournesol, jojoba ou amande douce, le squalane et les triglycérides restent permis). Sur toutes les cartes.
- Un produit proposé à un profil réactif ne contient pas non plus d'alcool desséchant (`DRYING_ALCOHOL` : `Alcohol`, `Alcohol Denat.`, `SD Alcohol …`, `Denatured Alcohol`, `Ethanol`, `Isopropyl Alcohol`, comparés après `normalise`). Les alcools gras (cétylique, cétéarylique, stéarylique, béhénylique…) et l'alcool benzylique (conservateur) restent permis. Décision de Phil ; les profils non réactifs ne sont pas filtrés.
- Le `name` d'un produit est un libellé descriptif neutre écrit par nous (type, actif, dosage : « Sérum à la niacinamide 10 % »), jamais le titre marketing d'Amazon ; la marque est le champ `brand`. `PROMISE` refuse aussi `anti-` (avec trait d'union), `lifting`, `repulp` et `booster`.
- Sous les exemples de la carte du soir, seulement quand le profil demande du rétinol et qu'au moins un exemple est affiché, `RETINOL_NOTE` (`content.ts`) rappelle que le rétinol est déconseillé pendant la grossesse et l'allaitement, renvoie vers un médecin ou un pharmacien dans une phrase à part, sans nuance sur la grossesse, et explique le soir et l'écran solaire du matin. Rien de plus que ce que le site dit déjà, aucun chiffre.
- L'ASIN respecte `^[A-Z0-9]{10}$` ; chaque produit a une source en `https://` et une date ; les `id` sont uniques.
- Les textes ne contiennent aucune promesse de résultat : `catalogueDefects` relit le nom, la marque et chaque INCI, avec la liste `PROMISE` de `products.ts`.
- La comparaison des INCI ignore la casse et une précision finale entre `(…)` ou `[…]` (`Titanium Dioxide [nano]` compte comme `Titanium Dioxide`), ainsi qu'un `*` (avant ou après) et un point final (`Lavandula Angustifolia Oil*` reste une huile essentielle). `CI 77891` et `CI 77947` comptent comme dioxyde de titane et oxyde de zinc. L'`active` d'un `serum` ou d'un `evening` est limité aux clés de `SERUM_NAMES` et `EVENING_TITLES`, les seules que le profil demande. Le bloc d'exemples est projeté dans l'emplacement `actions` de la carte, après les pastilles de l'étiquette.
- Le tag d'affiliation apparaît une fois dans chaque lien, et seulement `amazon.fr` est un hôte de lien produit.

## Règles réécrites

`CLAUDE.md` (« Le projet »), `index.html`, `app.html`, `result.html`, `README.md` s'il mentionne « sans marque ».

## Livraison

1. PR « Structure » : types, affichage, mention, tests, règles. Catalogue vide, donc rien de visible en production.
2. PR « Catalogue » : tableau (produit, composition, source, lien à contrôler) remis à Phil ; seuls les produits validés sont ajoutés. Catalogue initial : 16 produits, proposé le 2026-10-21 et validé par Phil (tous les liens ouverts ; la date de proposition reste la date de validation). Les données sont dans `src/app/routine/catalogue.ts`, réexportées par `products.ts`. Un hydratant n’est montré que sur la carte de sa richesse (`rich`), et un écran minéral qui contient un photostabilisant organique (méthoxycrylène) est écarté pour une peau réactive comme tout écran hybride.

Quality gates avant chaque PR : `lint`, `typecheck`, `test`, `build`, `e2e` (axe Jour/Nuit sur l'état avec produits), `format:check`.

## Hors périmètre

PA-API, prix et images Amazon, mesure Umami des clics (le site n'est pas encore enregistré), modification de Fuda.

## À la charge de Phil

- Contrôler chaque lien Amazon du tableau.
- Déclarer le site dans le compte Partenaires Amazon.
