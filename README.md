# Skincare Quizz

Votre routine de soin en 10 questions : type de peau évoqué, ingrédients à repérer, routine matin et soir et types de produits. Site : <https://skincare-quizz.phamelin.fr>, construit avec le design system [Fuda](https://github.com/phamelin42/design-system-fuda).

## Démarrer

Node ≥ 22.22.3 est requis (Angular 22) ; `.nvmrc` indique 24.

```bash
npm ci
npm start          # http://localhost:4200
```

| Commande                             | Rôle                                                              |
| ------------------------------------ | ----------------------------------------------------------------- |
| `npm test`                           | Tests unitaires (Vitest via `ng test`)                            |
| `npm run lint` / `npm run typecheck` | ESLint / tsc                                                      |
| `npm run build`                      | Build de production dans `dist/skincare-quizz/browser`            |
| `npm run e2e`                        | Playwright sur ce build : parcours clavier, 320 px, axe Jour/Nuit |
| `npm run format`                     | Prettier                                                          |

Pour lancer Playwright avec un Chromium déjà installé : `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/chemin/chrome npm run e2e`.

## Mise en ligne

Vercel (`vercel.json`). Le projet Vercel et le DNS de `skincare-quizz.phamelin.fr` sont créés par le dépôt `infra` (`projects.json`).
