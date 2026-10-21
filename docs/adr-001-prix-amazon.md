# ADR 001 : afficher les prix Amazon par l’API Creators et le VPS OVH

Statut : **proposé** le 21/10/2026, à valider par Phil. Vaut pour skincare-quizz et tea-quizz.

## Contexte

Phil veut le prix entre parenthèses à côté de chaque produit. Jusqu’ici, les deux sites n’affichent
aucun prix : Amazon n’autorise que des prix à jour, tirés de son API, et un prix saisi à la main
serait faux dès le lendemain. Décision de Phil (21/10/2026) : passer par l’API Amazon, avec un
service sur son VPS OVH.

## Ce qui a été vérifié (documentation Amazon, lue le 21/10/2026)

- **PA-API 5 est dépréciée** : ses appels renvoient `403 AccessDeniedException`. Elle est remplacée
  par la **Creators API** (`GetItems` accepte plusieurs ASIN par appel, et un appel compte pour une
  seule transaction).
- **Éligibilité** : compte Partenaires inscrit sur la place de marché (France : `www.amazon.fr`
  est listée) et, d’après la page d’introduction de la Creators API, **au moins 10 ventes
  qualifiantes sur les 30 derniers jours**. Cette condition vient d’une seule page : à confirmer
  dans Associates Central et le contrat de partenariat avant tout code.
- **Perte d’accès** : sans vente qualifiante pendant 30 jours consécutifs, l’accès est coupé
  (rétabli dans les deux jours après de nouvelles ventes expédiées). Les erreurs sont des `429`.
- **Quota initial** : 1 requête par seconde et 8 640 par jour ; il croît avec le chiffre d’affaires
  généré par l’API.
- **Cache autorisé** : 1 heure au plus pour les offres (donc les prix), 1 jour pour les autres
  champs. Les règles d’affichage d’un prix (horodatage, mention) ne figurent pas sur les pages lues :
  à chercher dans le contrat de licence et le contrat Partenaires.
- **Pas lu** : l’authentification (jeton, signature), l’adresse de l’API et le format de réponse
  (pages « Get Started », « Using cURL », « API Reference »). Première étape du plan.

## Décision proposée

Un petit service Node, **`prix-amazon`** (dépôt à créer), sur le VPS OVH derrière Traefik, comme
`travel-book`. Les sites ne parlent jamais à Amazon : ils interrogent ce service.

- `GET /prix?asins=A,B,C` : 10 ASIN au plus, chacun contrôlé (`^[A-Z0-9]{10}$`) **et présent dans une
  liste blanche** tirée des catalogues des deux sites. Aucune saisie libre n’atteint l’API Amazon,
  le service n’est donc pas un relais ouvert.
- Réponse : `{ "prix": { "<ASIN>": { "montant": 12.9, "devise": "EUR", "vu": "2026-10-21T16:05:00Z" } | null } }`.
- **Rafraîchissement par minuterie, pas par visiteur** : le service interroge Amazon toutes les
  heures pour l’ensemble de la liste blanche (76 produits aujourd’hui, 8 appels de 10 ASIN,
  192 appels par jour, très en dessous des 8 640), garde les prix en mémoire et sert uniquement ce cache. Un prix
  de plus d’une heure n’est plus servi (`null`).
- CORS limité aux deux sites. Aucun cookie, aucune donnée personnelle, aucun journal d’adresses
  au-delà de ce que Traefik conserve déjà.
- Secrets : les identifiants Partenaires vivent dans les variables d’environnement du VPS, jamais
  dans un dépôt (ils sont publics).
- DNS : une entrée `target: "vps"` dans `infra/projects.json` (sous-domaine proposé :
  `prix.phamelin.fr`). Le déploiement sur le VPS reste le travail du workflow du nouveau dépôt.

## Côté sites

- Un service Angular à signaux récupère les prix **après le premier affichage** (le résultat ne
  dépend jamais du prix) ; son URL est un jeton d’injection, remplacé dans les tests.
- Prix absent, service injoignable ou prix périmé : **rien ne s’affiche**, ni tiret ni zéro. Les
  sites fonctionnent à l’identique sans le service.
- Affichage proposé : le montant entre parenthèses après le nom, `(12,90 €)`, formaté par `Intl`, avec
  une précision lue par les lecteurs d’écran (« prix constaté à 16 h »). Jamais la couleur seule.
- Les e2e et l’audit axe passent sans réseau externe (`page.route`) ; la CSP ouvre `connect-src`
  au seul sous-domaine du service.
- `CLAUDE.md` des deux sites : la règle « aucun prix » est remplacée par celle-ci.

## Conséquences

- **Une dépendance d’exécution nouvelle** (le service) et un compte à maintenir : sans vente
  qualifiante sur 30 jours, les prix disparaissent d’eux-mêmes et les sites continuent de marcher.
- Le service a ses propres tests (réponses Amazon simulées), son workflow et sa supervision.
- Un second quota ou une API différente en cas de nouveau changement chez Amazon : le contrat
  (`GET /prix`) isole les sites de ces changements.

## Ce qui bloque, et ce que Phil doit trancher

1. **Éligibilité** : le compte Partenaires remplit-il la condition de ventes qualifiantes ? Sinon,
   pas d’accès à l’API : il faut d’abord générer ces ventes, ou renoncer aux prix.
2. **Identifiants** : à créer dans Associates Central, puis à déposer dans l’environnement du VPS
   (variables `AMAZON_CREATORS_*`, noms définitifs à la lecture de la documentation).
3. **VPS** : où vit le `compose.yml` (quel dépôt) et comment le workflow s’y connecte ; création du
   dépôt `prix-amazon` et du secret de déploiement.
4. **Sous-domaine** (`prix.phamelin.fr` proposé) et **format d’affichage** (ci-dessus).

## Plan

0. Lire l’authentification et le format de réponse de la Creators API ; confirmer l’éligibilité.
1. Dépôt `prix-amazon` : service, liste blanche, cache horaire, tests avec réponses simulées.
2. Entrée `infra/projects.json` (PR) et déploiement sur le VPS (Phil pour les secrets).
3. Intégration dans les deux sites derrière le jeton d’injection, sans effet tant que le service
   ne répond pas ; tests, e2e, axe.
4. Fusion des sites, contrôle de la production, rétro.
