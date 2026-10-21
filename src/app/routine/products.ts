import { InjectionToken } from '@angular/core';
import { CATALOGUE } from './catalogue';
import { EVENING_TITLES, INGREDIENTS, SERUM_NAMES } from './content';
import type { ProductCard, Profile } from './profile';

/** Identifiant du compte Partenaires Amazon ; le seul endroit où il s’écrit. */
export const AFFILIATE_TAG = 'phamelin-21';

export interface Product {
  readonly id: string;
  /**
   * Nom descriptif neutre, écrit par nous : type, actif et dosage (« Sérum à la niacinamide
   * 10 % »). Jamais le titre de la fiche Amazon, qui porte des arguments de vente ; la marque
   * est le champ `brand`.
   */
  readonly name: string;
  readonly brand: string;
  /** Clé de la carte illustrée : `cleanser`, `serum`, `evening`, etc. */
  readonly card: string;
  /** Pour `serum` et `evening` : l’actif (clé d’`INGREDIENTS`) ; `null` pour les autres cartes. */
  readonly active: string | null;
  /** Pour `sunscreen` : l’indice de protection ; `null` ailleurs. */
  readonly spf: 30 | 50 | null;
  /**
   * Pour `moisturiser` : crème riche (`true`) ou légère (`false`), comme `profile.rich` ; `null`
   * ailleurs. Les repères de la carte (glycérine, hyaluronate) se retrouvent aussi dans une
   * crème riche : sans ce champ, elle s’afficherait sous « Une crème hydratante légère ».
   */
  readonly rich: boolean | null;
  readonly asin: string;
  /** Liste INCI recopiée de la fiche du fabricant. */
  readonly inci: readonly string[];
  readonly sourceUrl: string;
  /** Date de proposition du lien, qui vaut validation une fois que Phil l’a ouvert (AAAA-MM-JJ). */
  readonly validated: string;
}

/** Le catalogue vit dans `catalogue.ts` (des données, sans logique) ; il se lit ici comme avant. */
export { CATALOGUE };

/** Un jeton plutôt que l’import direct, pour que les tests fournissent leur propre catalogue. */
export const PRODUCT_CATALOGUE = new InjectionToken<readonly Product[]>('PRODUCT_CATALOGUE', {
  providedIn: 'root',
  factory: () => CATALOGUE,
});

export function amazonUrl(asin: string): string {
  return `https://www.amazon.fr/dp/${asin}?tag=${AFFILIATE_TAG}`;
}

const ASIN = /^[A-Z0-9]{10}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Les cartes qui montrent des exemples ; `makeupRemover` et `exfoliant` n’en ont pas. */
const CARDS: readonly string[] = ['serum', 'evening', 'cleanser', 'moisturiser', 'sunscreen'];
/**
 * Les actifs que le profil peut demander à chaque carte : les clés de `SERUM_NAMES` et
 * `EVENING_TITLES`, les mêmes que `profile.serum` et `profile.evening`. Une autre clé ne
 * s’afficherait jamais.
 */
const ACTIVES: Readonly<Record<string, object>> = { serum: SERUM_NAMES, evening: EVENING_TITLES };

/**
 * Les formulations qui promettent un résultat, en français et en anglais : le contenu du site
 * n’en fait aucune, et un nom de produit qui en porte une ne doit pas s’afficher tel quel.
 * Volontairement large (sans bornes de mot) : un faux positif se corrige en renommant, un
 * faux négatif publie une promesse. `anti-` avec son trait d’union attrape les titres
 * marketing (anti-UV, anti-pollution…) sans toucher « antioxidant » ; `lifting`, `repulp` et
 * `booster` sont des arguments de vente que seul un titre de fiche porte.
 */
export const PROMISE =
  /guéri|soign|anti-?(rides?|taches?|âge|age|imperfections?|acné|cernes?)|efface|élimin|miracle|garanti|prévient|répare|rajeun|éclaircit|détox|bienfait|clinically proven|cliniquement prouvé|anti-|lifting|repulp|booster/i;

/** Ce qui fait une crème riche : les céramides des repères de la carte, et le squalane. */
const RICH_MARKERS: ReadonlySet<string> = new Set(
  ['Ceramide NP', 'Ceramide AP', 'Ceramide EOP', 'Squalane'].map((name) => name.toLowerCase()),
);

const QUALIFIER = /\s*(\([^)]*\)|\[[^\]]*\]|[*.]+)$/;

/**
 * Un nom INCI sans casse ni précision finale : les fabricants écrivent `Titanium Dioxide [nano]`
 * (suffixe imposé par l’UE aux nanomatériaux) ou `Glycerin (vegetable)`, et ce sont les mêmes
 * ingrédients que ceux des repères de la carte. Un `*` (marque du bio, avant ou après le nom) et
 * un point final (fin d’une liste recopiée) ne changent pas l’ingrédient non plus : sans cela,
 * `Lavandula Angustifolia Oil*` échapperait aux règles d’exclusion.
 */
export function normalise(name: string): string {
  let result = name
    .trim()
    .toLowerCase()
    .replace(/^[*\s]+/, '');
  while (QUALIFIER.test(result)) result = result.replace(QUALIFIER, '');
  return result;
}

/**
 * Les filtres UV organiques (« chimiques »), sous leur nom INCI et leurs synonymes courants :
 * un écran qui en contient, même avec un filtre minéral (écran « hybride »), n’est pas
 * proposé à une peau réactive. Comparés après `normalise`, donc sans casse ni précision finale
 * (`[nano]`). Une liste fermée : un filtre absent ici passerait pour minéral, d’où l’exigence
 * de la compléter à chaque ajout au catalogue.
 */
export const CHEMICAL_UV_FILTERS: readonly string[] = [
  'Octocrylene',
  'Butyl Methoxydibenzoylmethane',
  'Ethylhexyl Methoxycinnamate',
  'Homosalate',
  'Ethylhexyl Salicylate',
  'Benzophenone-3',
  'Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine',
  'Methylene Bis-Benzotriazolyl Tetramethylbutylphenol',
  'Ethylhexyl Triazone',
  'Diethylamino Hydroxybenzoyl Hexyl Benzoate',
  'Drometrizole Trisiloxane',
  'Terephthalylidene Dicamphor Sulfonic Acid',
  'Phenylbenzimidazole Sulfonic Acid',
  'Diethylhexyl Butamido Triazone',
  'Isoamyl P-Methoxycinnamate',
  '4-Methylbenzylidene Camphor',
  'Polysilicone-15',
  'Octisalate',
  'Octinoxate',
  'Avobenzone',
  'Oxybenzone',
  'Bemotrizinol',
  'Parsol 1789',
  'Octyl Methoxycinnamate',
  'Octyl Salicylate',
  'Octyl Triazone',
  'Benzophenone-1',
  'Benzophenone-2',
  'Benzophenone-4',
  'Disodium Phenyl Dibenzimidazole Tetrasulfonate',
  'Tris-Biphenyl Triazine',
  'Ethylhexyl Dimethyl PABA',
  'Octyl Dimethyl PABA',
  'Padimate O',
  'PEG-25 PABA',
  'Bisoctrizole',
  'Ecamsule',
  'Iscotrizinol',
  // Photostabilisant organique de la famille des cinnamates, pas un filtre UV à proprement
  // parler : il écarte pourtant l’écran de la peau réactive, comme tout écran « hybride ».
  'Ethylhexyl Methoxycrylene',
];

/**
 * Les huiles essentielles, sur une entrée INCI déjà normalisée : la mention littérale, ou une
 * plante aromatique (nom botanique ou nom courant anglais) dont l’entrée finit par « Oil ». Le
 * nom de la plante ne suffit pas (un extrait de lavande n’est pas une huile essentielle) et
 * « Oil » seul non plus : les huiles végétales (tournesol, jojoba, amande douce, argan, olive,
 * églantier, pépins d’agrumes) et le squalane ne sont pas concernés. Une liste fermée de
 * plantes, à compléter avec le catalogue.
 */
export const ESSENTIAL_OIL = new RegExp(
  [
    'essential oil|huile essentielle',
    '^(?:lavandula|mentha|rosmarinus|melaleuca|eucalyptus|cymbopogon|pelargonium|cananga|ylang|santalum|juniperus|thymus|salvia sclarea|salvia officinalis|origanum|cinnamomum|syzygium aromaticum|eugenia|boswellia|rosa damascena|rosa centifolia|jasminum|chamomilla recutita|matricaria|anthemis|pogostemon|vetiveria|cedrus|litsea|abies|pinus|zingiber|ocimum|piper)\\b.*\\boil$',
    // Les agrumes et les noms courants : l’huile de pépins est une huile végétale, pas une huile
    // essentielle (l’huile de pignon de pin, sous Pinus, reste écartée par prudence).
    '^citrus\\b(?!.*\\bseed\\b).*\\boil$',
    '^(?:tea tree|lavender|peppermint|spearmint|rosemary|eucalyptus|clove|cinnamon|thyme|geranium|sandalwood|patchouli|bergamot|lemon|orange)\\b(?!.*\\bseed\\b).*\\boil$',
  ].join('|'),
);

/**
 * L'alcool desséchant (éthanol) sur une entrée INCI déjà normalisée : `Alcohol`, `Alcohol Denat.`,
 * `SD Alcohol 40-B`, `Denatured Alcohol`, `Ethanol`, `Isopropyl Alcohol`. Les alcools gras
 * (cétylique, cétéarylique, stéarylique, béhénylique…) sont des corps gras doux, et l'alcool
 * benzylique un conservateur : aucun ne correspond, car l'entrée entière doit être l'un des noms
 * ci-dessus.
 */
export const DRYING_ALCOHOL =
  /^(?:alcohol(?: denat\.?)?(?: denatured)?|alcohol denat\.? [\w.-]+|sd alcohol(?: [\w-]+)?|denatured alcohol|ethanol|isopropyl alcohol)$/;

const CHEMICAL_UV = new Set(CHEMICAL_UV_FILTERS.map(normalise));

/**
 * Les filtres minéraux, sous leur nom INCI ou leur code colorant : les fabricants listent aussi
 * `CI 77891` (dioxyde de titane) et `CI 77947` (oxyde de zinc), le plus souvent suivis du nom
 * entre parenthèses, que `normalise` retire.
 */
const MINERAL_UV = /^(?:zinc oxide|titanium dioxide|ci ?77947|ci ?77891)$/;

function normalised(inci: readonly string[]): Set<string> {
  return new Set(inci.map(normalise));
}

/**
 * Les règles qui ne dépendent pas du profil : `examplesFor` applique les autres au moment
 * de l’affichage. Un message par défaut, `[]` si le catalogue est valide.
 */
export function catalogueDefects(catalogue: readonly Product[]): string[] {
  const defects: string[] = [];
  const seen = new Set<string>();
  for (const product of catalogue) {
    const defect = (message: string) => defects.push(`${product.id} : ${message}`);
    if (seen.has(product.id)) defect('id en double');
    seen.add(product.id);
    if (!ASIN.test(product.asin)) defect(`ASIN invalide (${product.asin})`);
    if (!product.sourceUrl.startsWith('https://')) defect('source absente ou hors https://');
    if (!DATE.test(product.validated)) defect(`date de validation invalide (${product.validated})`);
    const texts = [product.name, product.brand, ...product.inci];
    if (texts.some((text) => PROMISE.test(text))) defect('promesse de résultat dans les textes');
    if (!CARDS.includes(product.card)) defect(`carte inconnue (${product.card})`);
    if (product.card === 'sunscreen' && product.spf === null) defect('SPF manquant');
    if (product.card === 'moisturiser') {
      if (product.rich === null) {
        defect('richesse manquante (rich)');
      } else if (
        product.rich &&
        !product.inci.map(normalise).some((name) => RICH_MARKERS.has(name))
      ) {
        defect('crème riche sans céramide ni squalane dans la composition');
      }
    } else if (product.rich !== null) {
      defect('richesse (rich) réservée aux hydratants');
    }
    const allowed = ACTIVES[product.card];
    if (!allowed) continue;
    if (product.active === null) {
      defect('actif manquant');
    } else if (!Object.hasOwn(allowed, product.active)) {
      defect(`actif ${product.active} impossible pour la carte ${product.card}`);
    } else {
      const present = normalised(product.inci);
      const known = INGREDIENTS[product.active as keyof typeof INGREDIENTS].inci;
      if (!known.some((name) => present.has(normalise(name)))) {
        defect(`aucun INCI de l’actif ${product.active} dans la composition`);
      }
    }
  }
  return defects;
}

/** Au plus trois exemples dont la composition correspond aux repères de la carte, sans classement. */
export function examplesFor(
  card: ProductCard,
  profile: Profile,
  catalogue: readonly Product[],
): Product[] {
  return catalogue
    .filter((product) => {
      if (product.card !== card.key) return false;
      if (card.key === 'serum' && product.active !== profile.serum) return false;
      if (card.key === 'evening' && product.active !== profile.evening) return false;
      if (card.key === 'sunscreen' && product.spf !== profile.spf) return false;
      if (card.key === 'moisturiser' && product.rich !== profile.rich) return false;
      const inci = normalised(product.inci);
      if (profile.reactive) {
        const entries = [...inci];
        const scented = entries.some((name) => /^(parfum|fragrance)/.test(name));
        const drying = entries.some((name) => DRYING_ALCOHOL.test(name));
        if (scented || drying || entries.some((name) => ESSENTIAL_OIL.test(name))) return false;
        if (card.key === 'sunscreen') {
          const mineral = entries.some((name) => MINERAL_UV.test(name));
          // Minéral seulement : un filtre chimique en plus (écran hybride) écarte le produit.
          if (!mineral || entries.some((name) => CHEMICAL_UV.has(name))) return false;
        }
      }
      if (card.key === 'cleanser' || card.key === 'moisturiser') {
        return card.labels.some((label) => inci.has(normalise(label)));
      }
      return true;
    })
    .slice(0, 3);
}
