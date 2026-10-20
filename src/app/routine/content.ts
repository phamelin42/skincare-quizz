import type { FdCardSky, FdEmblemName } from 'fuda';

export type SkinType = 'dry' | 'oily' | 'combination' | 'normal';
export type Concern = 'blemishes' | 'tightness' | 'spots' | 'wrinkles' | 'redness';
export type IngredientKey =
  | 'niacinamide'
  | 'vitaminC'
  | 'hyaluronic'
  | 'soothing'
  | 'ceramides'
  | 'salicylic'
  | 'azelaic'
  | 'retinol';
export type EveningKey = 'salicylic' | 'azelaic' | 'retinol';
export type SerumKey = 'niacinamide' | 'vitaminC' | 'hyaluronic' | 'soothing';
export type StartKey = 'none' | 'cleanser' | 'some' | 'complete';

export interface Ingredient {
  readonly name: string;
  /** Noms INCI à repérer sur l’étiquette. */
  readonly inci: readonly string[];
  readonly dose: string;
  readonly why: string;
}

export const INGREDIENTS: Record<IngredientKey, Ingredient> = {
  niacinamide: {
    name: 'Niacinamide (vitamine B3)',
    inci: ['Niacinamide'],
    dose: '4 à 10 %',
    why: 'Utilisée pour équilibrer le sébum et atténuer les imperfections. En général bien tolérée.',
  },
  vitaminC: {
    name: 'Vitamine C',
    inci: ['Ascorbic Acid', 'Ascorbyl Glucoside', 'Sodium Ascorbyl Phosphate'],
    dose: '10 à 15 %',
    why: 'Antioxydante : elle aide à uniformiser le teint. À appliquer le matin, avant l’écran solaire.',
  },
  hyaluronic: {
    name: 'Acide hyaluronique',
    inci: ['Sodium Hyaluronate'],
    dose: '',
    why: 'Retient l’eau à la surface de la peau et atténue la sensation de tiraillement. À poser sur peau encore humide.',
  },
  soothing: {
    name: 'Panthénol et centella',
    inci: ['Panthenol', 'Centella Asiatica Extract', 'Madecassoside'],
    dose: '',
    why: 'Apaisants : adaptés à une peau qui rougit ou qui picote facilement.',
  },
  ceramides: {
    name: 'Céramides',
    inci: ['Ceramide NP', 'Ceramide AP', 'Ceramide EOP'],
    dose: '',
    why: 'Elles renforcent la barrière de la peau : utiles quand elle tiraille ou réagit facilement.',
  },
  salicylic: {
    name: 'Acide salicylique (BHA)',
    inci: ['Salicylic Acid'],
    dose: '0,5 à 2 %',
    why: 'Pénètre dans les pores et aide à limiter points noirs et boutons. Commencez un soir sur deux.',
  },
  azelaic: {
    name: 'Acide azélaïque',
    inci: ['Azelaic Acid'],
    dose: '10 %',
    why: 'Aide à atténuer imperfections, marques et rougeurs. Souvent mieux supporté que les autres acides.',
  },
  retinol: {
    name: 'Rétinol',
    // Le rétinal est une autre molécule, plus puissante : la dose ci-dessous ne vaut que pour le rétinol.
    inci: ['Retinol'],
    dose: '0,1 à 0,3 %',
    why: 'Référence pour les premiers signes de l’âge. À faible dose, le soir seulement, avec une protection solaire le matin.',
  },
};

/** Rythme d’introduction des soins du soir. */
export const EVENING_FREQUENCY: Record<EveningKey, string> = {
  salicylic: 'Un soir sur deux au début, puis tous les soirs si la peau le supporte.',
  azelaic: 'Une fois par jour, le soir. Un soir sur deux si la peau picote.',
  retinol: 'Deux soirs par semaine pendant trois semaines, puis un soir sur deux.',
};

export const EVENING_TITLES: Record<EveningKey, string> = {
  salicylic: 'Un soin à l’acide salicylique',
  azelaic: 'Un soin à l’acide azélaïque',
  retinol: 'Un soin au rétinol',
};

/** Complément du mot « sérum ». */
export const SERUM_NAMES: Record<SerumKey, string> = {
  niacinamide: 'à la niacinamide',
  vitaminC: 'à la vitamine C',
  hyaluronic: 'à l’acide hyaluronique',
  soothing: 'apaisant',
};

export interface SkinTypeContent {
  /** Suite de « Vos réponses évoquent une peau… ». */
  readonly phrase: string;
  /** Suite de « Peau… » dans l’étiquette. */
  readonly label: string;
  readonly emblem: FdEmblemName;
  readonly sky: FdCardSky;
  readonly text: string;
}

export const SKIN_TYPES: Record<SkinType, SkinTypeContent> = {
  dry: {
    phrase: 'à tendance sèche',
    label: 'sèche',
    emblem: 'fuji',
    sky: 'fuji',
    text: 'Votre peau semble manquer d’eau ou de gras : elle tiraille, parfois jusqu’à paraître terne. L’objectif est de nettoyer sans décaper, d’hydrater et de protéger la barrière de la peau.',
  },
  oily: {
    phrase: 'à tendance grasse',
    label: 'grasse',
    emblem: 'koi',
    sky: 'asagi',
    text: 'Votre peau semble produire beaucoup de sébum sur tout le visage. L’objectif est de nettoyer en douceur, sans décaper, d’hydrater léger et de protéger du soleil.',
  },
  combination: {
    phrase: 'à tendance mixte',
    label: 'mixte',
    emblem: 'cho',
    sky: 'sakura',
    text: 'Votre peau semble plus brillante au centre du visage (front, nez, menton) et plus confortable ou plus sèche sur les joues. L’objectif est de garder des textures légères partout et d’ajouter un peu de richesse sur les joues si besoin.',
  },
  normal: {
    phrase: 'plutôt équilibrée',
    label: 'équilibrée',
    emblem: 'sakura',
    sky: 'sakura',
    text: 'Votre peau semble plutôt équilibrée : ni très grasse, ni très sèche. L’objectif est de garder une routine simple et régulière, et de ne jamais négliger l’écran solaire.',
  },
};

export const CONCERN_LABELS: Record<Concern, string> = {
  blemishes: 'Imperfections',
  tightness: 'Tiraillements',
  spots: 'Taches et teint',
  wrinkles: 'Rides et fermeté',
  redness: 'Rougeurs',
};

export const START_ADVICE: Record<StartKey, string> = {
  none: 'Vous partez de zéro : installez d’abord le nettoyant, l’hydratant et l’écran solaire pendant deux semaines, puis ajoutez un actif à la fois.',
  cleanser:
    'Vous avez déjà le premier réflexe. Ajoutez l’hydratant et l’écran solaire, puis un actif après deux semaines.',
  some: 'Comparez avec ce que vous utilisez déjà : gardez ce qui vous convient et ne changez qu’un produit à la fois.',
  complete:
    'Gardez ce qui fonctionne. Pour tester un nouvel actif, introduisez-le seul, une semaine avant le suivant.',
};
