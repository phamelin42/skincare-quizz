import { TestBed } from '@angular/core/testing';
import { type EveningKey, type SerumKey } from './content';
import {
  AFFILIATE_NOTICE,
  AFFILIATE_TAG,
  amazonUrl,
  CATALOGUE,
  catalogueDefects,
  CHEMICAL_UV_FILTERS,
  ESSENTIAL_OIL,
  EXAMPLES_NOTE,
  examplesFor,
  normalise,
  PRODUCT_CATALOGUE,
  PROMISE,
  type Product,
} from './products';
import { FIXTURE_CATALOGUE } from './products.fixture';
import { analyse, type Answers, type ProductCard, type Profile, products } from './profile';
import { type QuestionId, QUESTIONS } from './questions';

/** Réponses par valeur ; les questions non précisées prennent leur dernière option. */
function answers(values: Partial<Record<QuestionId, string>> = {}): Answers {
  return QUESTIONS.map((question) => {
    const value = values[question.id];
    if (value === undefined) return question.options.length - 1;
    const index = question.options.findIndex((option) => option.value === value);
    if (index < 0) throw new Error(`${question.id} n’a pas d’option ${value}`);
    return index;
  });
}

function profileFor(values: Partial<Record<QuestionId, string>> = {}): Profile {
  return analyse(answers({ breakouts: 'rarely', ...values }));
}

function cardOf(profile: Profile, key: string): ProductCard {
  const card = products(profile).find((candidate) => candidate.key === key);
  if (!card) throw new Error(`Pas de carte ${key} pour ce profil`);
  return card;
}

function ids(list: readonly Product[]): string[] {
  return list.map((item) => item.id);
}

function fixtureProduct(id: string): Product {
  const found = FIXTURE_CATALOGUE.find((item) => item.id === id);
  if (!found) throw new Error(`Pas de produit ${id} dans la fixture`);
  return found;
}

/** Un produit de la fixture, modifié. */
function altered(id: string, fields: Partial<Product>): Product {
  return { ...fixtureProduct(id), ...fields };
}

/** Peau grasse, sans réaction, moins de 40 ans : hydratant léger (sinon l’âge le rend riche). */
const OILY = {
  afterWash: 'oily',
  evening: 'oily',
  pores: 'oily',
  reactions: 'never',
  age: '25to39',
} as const;

describe('constantes', () => {
  it('définit le tag d’affiliation à un seul endroit', () => {
    expect(AFFILIATE_TAG).toBe('phamelin-21');
  });

  it('affiche la mention des Partenaires Amazon et la précision sur les exemples', () => {
    expect(AFFILIATE_NOTICE).toBe(
      'En tant que Partenaire Amazon, je réalise un bénéfice sur les achats remplissant les conditions requises.',
    );
    expect(EXAMPLES_NOTE).toBe(
      'Exemples dont la composition correspond aux repères ci-dessus, présentés sans classement.',
    );
  });

  it('livre un catalogue sans défaut, avec au moins un produit par type à exemples', () => {
    expect(catalogueDefects(CATALOGUE)).toEqual([]);
    for (const card of ['serum', 'evening', 'cleanser', 'moisturiser', 'sunscreen']) {
      expect(
        CATALOGUE.some((product) => product.card === card),
        card,
      ).toBe(true);
    }
  });

  it('injecte le catalogue du dépôt, remplaçable dans les tests', () => {
    expect(TestBed.inject(PRODUCT_CATALOGUE)).toBe(CATALOGUE);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PRODUCT_CATALOGUE, useValue: FIXTURE_CATALOGUE }],
    });
    expect(TestBed.inject(PRODUCT_CATALOGUE)).toBe(FIXTURE_CATALOGUE);
  });
});

describe('amazonUrl', () => {
  it('construit un lien amazon.fr avec le tag d’affiliation', () => {
    expect(amazonUrl('B0TESTTEST1')).toBe('https://www.amazon.fr/dp/B0TESTTEST1?tag=phamelin-21');
  });
});

describe('fixture partagée', () => {
  it('couvre chaque sérum, chaque soin du soir et les deux SPF', () => {
    const serums: SerumKey[] = ['niacinamide', 'vitaminC', 'hyaluronic', 'soothing'];
    const evenings: EveningKey[] = ['salicylic', 'azelaic', 'retinol'];
    for (const key of serums) {
      expect(FIXTURE_CATALOGUE.some((p) => p.card === 'serum' && p.active === key)).toBe(true);
    }
    for (const key of evenings) {
      expect(FIXTURE_CATALOGUE.some((p) => p.card === 'evening' && p.active === key)).toBe(true);
    }
    for (const spf of [30, 50]) {
      expect(FIXTURE_CATALOGUE.some((p) => p.card === 'sunscreen' && p.spf === spf)).toBe(true);
    }
  });
});

describe('catalogueDefects', () => {
  it('ne signale rien pour un catalogue valide, ni pour un catalogue vide', () => {
    expect(catalogueDefects(FIXTURE_CATALOGUE)).toEqual([]);
    expect(catalogueDefects([])).toEqual([]);
  });

  /** Chaque cas casse une seule règle sur un produit valide et doit produire un seul défaut. */
  const cases: [string, Product][] = [
    ['un ASIN en minuscules', altered('serum-niacinamide', { asin: 'b0test' })],
    ['un ASIN de 11 caractères', altered('serum-niacinamide', { asin: 'B0TESTTEST1' })],
    [
      'une source en http://',
      altered('serum-niacinamide', { sourceUrl: 'http://fabricant.example' }),
    ],
    ['une date 2026/10/20', altered('serum-niacinamide', { validated: '2026/10/20' })],
    ['une carte inconnue', altered('serum-niacinamide', { card: 'toner', active: null })],
    [
      'une carte makeupRemover (aucun exemple proposé pour elle)',
      altered('serum-niacinamide', { card: 'makeupRemover', active: null }),
    ],
    ['un sérum sans actif', altered('serum-niacinamide', { active: null })],
    ['un soin du soir sans actif', altered('evening-retinol', { active: null })],
    ['un actif hors INGREDIENTS', altered('serum-niacinamide', { active: 'collagen' })],
    [
      'un sérum dont l’actif est réservé au soir',
      altered('serum-niacinamide', { active: 'retinol', inci: ['Aqua', 'Retinol'] }),
    ],
    [
      'un soin du soir dont l’actif est réservé aux sérums',
      altered('evening-retinol', { active: 'niacinamide', inci: ['Aqua', 'Niacinamide'] }),
    ],
    [
      'un sérum dont l’actif n’est jamais demandé par un profil (ceramides)',
      altered('serum-niacinamide', { active: 'ceramides', inci: ['Aqua', 'Ceramide NP'] }),
    ],
    [
      'un soin du soir dont l’actif n’est jamais demandé par un profil (ceramides)',
      altered('evening-retinol', { active: 'ceramides', inci: ['Aqua', 'Ceramide NP'] }),
    ],
    ['un écran solaire sans SPF', altered('sunscreen-30-mineral', { spf: null })],
    ['un hydratant sans richesse (rich)', altered('moisturiser-light', { rich: null })],
    ['un sérum qui porte une richesse', altered('serum-niacinamide', { rich: false })],
    [
      'une crème riche sans céramide ni squalane',
      altered('moisturiser-rich', { inci: ['Aqua', 'Glycerin', 'Dimethicone'] }),
    ],
    [
      'un sérum dont l’INCI ne contient pas son actif',
      altered('serum-niacinamide', { inci: ['Aqua', 'Glycerin'] }),
    ],
    [
      'un soin du soir dont l’INCI ne contient pas son actif',
      altered('evening-retinol', { inci: ['Squalane'] }),
    ],
  ];

  for (const [label, broken] of cases) {
    it(`signale ${label}`, () => {
      const defects = catalogueDefects([broken]);
      expect(defects).toHaveLength(1);
      expect(defects[0]).toContain(broken.id);
    });
  }

  it('compare l’INCI de l’actif sans tenir compte de la casse', () => {
    const upper = altered('serum-niacinamide', { inci: ['AQUA', 'NIACINAMIDE'] });
    expect(catalogueDefects([upper])).toEqual([]);
  });

  it('accepte un INCI suivi d’une précision entre parenthèses ou crochets', () => {
    const qualified = altered('serum-niacinamide', { inci: ['Aqua', 'Niacinamide (vitamin B3)'] });
    expect(catalogueDefects([qualified])).toEqual([]);
  });

  it('ne trouve aucune promesse de résultat dans les mentions affichées', () => {
    expect(AFFILIATE_NOTICE).not.toMatch(PROMISE);
    expect(EXAMPLES_NOTE).not.toMatch(PROMISE);
  });

  it('signale une promesse de résultat dans le nom, la marque ou l’INCI', () => {
    const fields: [string, Partial<Product>][] = [
      ['le nom', { name: 'Sérum Anti-Taches' }],
      ['la marque', { brand: 'Anti-Taches' }],
      ['une entrée INCI', { inci: ['Aqua', 'Niacinamide', 'Anti-Taches'] }],
    ];
    for (const [label, change] of fields) {
      const defects = catalogueDefects([altered('serum-niacinamide', change)]);
      expect(defects, label).toHaveLength(1);
      expect(defects[0], label).toContain('promesse de résultat');
    }
  });

  it('reconnaît chaque terme de promesse, quelle que soit la casse', () => {
    const terms = [
      'guérit',
      'SOIGNE',
      'anti-rides',
      'antirides',
      'anti-âge',
      'anti-imperfections',
      'efface les taches',
      'élimine',
      'miracle',
      'garanti',
      'prévient',
      'répare',
      'rajeunit',
      'éclaircit',
      'détox',
      'bienfaits',
      'Clinically Proven',
      'cliniquement prouvé',
      'anti-UV',
      'Anti-Pollution',
      'effet lifting',
      'Lifting',
      'repulpe',
      'REPULPANT',
      'Booster d’éclat',
      'booster',
    ];
    for (const term of terms) {
      const defects = catalogueDefects([altered('serum-niacinamide', { name: `Sérum ${term}` })]);
      expect(defects, term).toHaveLength(1);
    }
  });

  it('refuse un titre marketing en nom de produit, la marque restant un champ à part', () => {
    const marketing = [
      'Sérum Visage Anti-Rides Booster d’éclat',
      'Crème Anti-UV Lifting Repulpant',
      'Fluide Anti-Pollution',
    ];
    for (const name of marketing) {
      const defects = catalogueDefects([altered('serum-niacinamide', { name })]);
      expect(defects, name).toHaveLength(1);
      expect(defects[0], name).toContain('promesse de résultat');
    }
    const neutral = altered('serum-niacinamide', {
      name: 'Sérum à la niacinamide 10 %',
      brand: 'Marque d’essai',
    });
    expect(catalogueDefects([neutral])).toEqual([]);
  });

  it('ne prend pas pour une promesse les noms INCI ordinaires', () => {
    const inci = [
      'Aqua',
      'Glycerin',
      'Tocopherol',
      'Tocopheryl Acetate',
      'Butylene Glycol',
      'Sodium Hyaluronate',
      'Niacinamide',
      'Ascorbyl Glucoside',
      'Caprylic/Capric Triglyceride',
      'Squalane',
      'Zinc Oxide',
      'Titanium Dioxide [nano]',
      'Antioxidant Complex',
      'Panthenol',
      'Phenoxyethanol',
    ];
    for (const entry of inci) {
      expect(PROMISE.test(entry), entry).toBe(false);
    }
    const product = altered('serum-niacinamide', { inci: ['Aqua', 'Niacinamide', ...inci] });
    expect(catalogueDefects([product])).toEqual([]);
  });

  it('signale un id en double', () => {
    const defects = catalogueDefects([
      fixtureProduct('serum-niacinamide'),
      altered('serum-vitaminC', { id: 'serum-niacinamide' }),
    ]);
    expect(defects).toHaveLength(1);
    expect(defects[0]).toContain('serum-niacinamide');
  });

  it('signale chaque défaut d’un même produit', () => {
    const defects = catalogueDefects([
      altered('serum-niacinamide', { asin: 'b0test', validated: 'hier' }),
    ]);
    expect(defects).toHaveLength(2);
  });
});

describe('examplesFor', () => {
  it('ne renvoie que les produits de la carte demandée', () => {
    const profile = profileFor({ ...OILY, concern: 'blemishes', time: '10' });
    for (const card of products(profile)) {
      for (const example of examplesFor(card, profile, FIXTURE_CATALOGUE)) {
        expect(example.card).toBe(card.key);
      }
    }
  });

  it('ne propose rien pour une carte sans produit au catalogue', () => {
    const profile = profileFor({ ...OILY, time: '10' });
    expect(examplesFor(cardOf(profile, 'makeupRemover'), profile, FIXTURE_CATALOGUE)).toEqual([]);
    expect(examplesFor(cardOf(profile, 'serum'), profile, [])).toEqual([]);
  });

  it('filtre le sérum sur l’actif du profil, pour chaque actif', () => {
    const byConcern: Record<SerumKey, string> = {
      niacinamide: 'blemishes',
      vitaminC: 'spots',
      hyaluronic: 'tightness',
      soothing: 'redness',
    };
    for (const [key, concern] of Object.entries(byConcern)) {
      const profile = profileFor({ ...OILY, concern });
      expect(profile.serum).toBe(key);
      const examples = examplesFor(cardOf(profile, 'serum'), profile, FIXTURE_CATALOGUE);
      expect(ids(examples)).toContain(`serum-${key}`);
      expect(examples.every((example) => example.active === key)).toBe(true);
    }
  });

  it('filtre le soin du soir sur l’actif du profil, pour chaque actif', () => {
    const cases: [EveningKey, Partial<Record<QuestionId, string>>][] = [
      ['salicylic', { concern: 'blemishes', reactions: 'never' }],
      ['azelaic', { concern: 'blemishes', reactions: 'often' }],
      ['retinol', { concern: 'wrinkles', reactions: 'never' }],
    ];
    for (const [key, values] of cases) {
      const profile = profileFor(values);
      expect(profile.evening).toBe(key);
      const examples = examplesFor(cardOf(profile, 'evening'), profile, FIXTURE_CATALOGUE);
      expect(ids(examples)).toEqual([`evening-${key}`]);
    }
  });

  it('n’associe pas la carte du soir d’un autre profil', () => {
    const salicylic = profileFor({ concern: 'blemishes', reactions: 'never' });
    const retinol = profileFor({ concern: 'wrinkles', reactions: 'never' });
    expect(ids(examplesFor(cardOf(salicylic, 'evening'), retinol, FIXTURE_CATALOGUE))).toEqual([
      'evening-retinol',
    ]);
  });

  it('filtre l’écran solaire sur le SPF du profil', () => {
    for (const [outdoors, spf] of [
      ['daily', 50],
      ['rarely', 30],
    ] as const) {
      const profile = profileFor({ reactions: 'never', outdoors });
      expect(profile.spf).toBe(spf);
      const examples = examplesFor(cardOf(profile, 'sunscreen'), profile, FIXTURE_CATALOGUE);
      expect(ids(examples)).toEqual([
        `sunscreen-${spf}-mineral`,
        `sunscreen-${spf}-chemical`,
        `sunscreen-${spf}-hybrid`,
      ]);
    }
  });

  it('écarte parfum et fragrance pour une peau réactive, sur chaque carte', () => {
    const reactive = profileFor({ ...OILY, reactions: 'often', concern: 'blemishes' });
    const calm = profileFor({ ...OILY, concern: 'blemishes' });
    const fragranced = ['serum-niacinamide-parfum', 'cleanser-parfum', 'moisturiser-parfum'];
    const keys = ['serum', 'cleanser', 'moisturiser'];

    const reactiveIds = keys.flatMap((key) =>
      ids(examplesFor(cardOf(reactive, key), reactive, FIXTURE_CATALOGUE)),
    );
    const calmIds = keys.flatMap((key) =>
      ids(examplesFor(cardOf(calm, key), calm, FIXTURE_CATALOGUE)),
    );
    for (const id of fragranced) {
      expect(reactiveIds).not.toContain(id);
      // Contrôle négatif : sans la réaction, les mêmes produits restent proposés.
      expect(calmIds).toContain(id);
    }
    expect(reactiveIds).toContain('serum-niacinamide');
  });

  it('reconnaît Parfum, Fragrance et PARFUM (FRAGRANCE), quelle que soit la casse', () => {
    const profile = profileFor({ ...OILY, reactions: 'often', concern: 'blemishes' });
    const card = cardOf(profile, 'serum');
    for (const word of ['Parfum', 'parfum', 'Fragrance', 'FRAGRANCE', 'PARFUM (FRAGRANCE)']) {
      const scented = altered('serum-niacinamide', { inci: ['Aqua', 'Niacinamide', word] });
      expect(examplesFor(card, profile, [scented])).toEqual([]);
    }
  });

  it('exige un filtre minéral à l’écran solaire d’une peau réactive', () => {
    const reactive = profileFor({ reactions: 'often', outdoors: 'daily' });
    expect(ids(examplesFor(cardOf(reactive, 'sunscreen'), reactive, FIXTURE_CATALOGUE))).toEqual([
      'sunscreen-50-mineral',
    ]);
    const calm = profileFor({ reactions: 'never', outdoors: 'rarely' });
    const reactive30 = profileFor({ reactions: 'sometimes', outdoors: 'rarely' });
    expect(
      ids(examplesFor(cardOf(reactive30, 'sunscreen'), reactive30, FIXTURE_CATALOGUE)),
    ).toEqual(['sunscreen-30-mineral']);
    expect(ids(examplesFor(cardOf(calm, 'sunscreen'), calm, FIXTURE_CATALOGUE))).toContain(
      'sunscreen-30-chemical',
    );
  });

  it('reconnaît un filtre minéral suivi de [nano] ou d’une précision, pour une peau réactive', () => {
    const reactive = profileFor({ reactions: 'often', outdoors: 'daily' });
    const card = cardOf(reactive, 'sunscreen');
    for (const entry of [
      'Titanium Dioxide [nano]',
      'Titanium Dioxide (nano)',
      'ZINC OXIDE [NANO]',
    ]) {
      const nano = altered('sunscreen-50-mineral', { inci: ['Aqua', entry] });
      expect(examplesFor(card, reactive, [nano])).toEqual([nano]);
    }
    const chemical = altered('sunscreen-50-chemical', { inci: ['Aqua', 'Avobenzone [nano]'] });
    expect(examplesFor(card, reactive, [chemical])).toEqual([]);
  });

  describe('écrans solaires hybrides', () => {
    const reactive = profileFor({ reactions: 'often', outdoors: 'daily' });
    const calm = profileFor({ reactions: 'never', outdoors: 'daily' });
    const hybrid = altered('sunscreen-50-mineral', {
      id: 'hybride',
      inci: ['Aqua', 'Titanium Dioxide [nano]', 'Octocrylene'],
    });

    it('écarte pour une peau réactive un écran à filtre minéral qui contient aussi un filtre chimique', () => {
      expect(examplesFor(cardOf(reactive, 'sunscreen'), reactive, [hybrid])).toEqual([]);
      // Contrôle négatif : une peau qui ne réagit pas le garde, seul le SPF compte.
      expect(examplesFor(cardOf(calm, 'sunscreen'), calm, [hybrid])).toEqual([hybrid]);
    });

    it('garde un écran uniquement minéral pour les deux profils', () => {
      const mineral = altered('sunscreen-50-mineral', {
        inci: ['Aqua', 'Zinc Oxide', 'Titanium Dioxide [nano]', 'Glycerin'],
      });
      expect(examplesFor(cardOf(reactive, 'sunscreen'), reactive, [mineral])).toEqual([mineral]);
      expect(examplesFor(cardOf(calm, 'sunscreen'), calm, [mineral])).toEqual([mineral]);
    });

    it('écarte chacun des filtres chimiques de la liste, même avec casse ou précision', () => {
      const card = cardOf(reactive, 'sunscreen');
      for (const filter of CHEMICAL_UV_FILTERS) {
        for (const entry of [filter, filter.toUpperCase(), `${filter} [nano]`, `${filter} (UV)`]) {
          const product = altered('sunscreen-50-mineral', { inci: ['Aqua', 'Zinc Oxide', entry] });
          expect(examplesFor(card, reactive, [product]), entry).toEqual([]);
        }
      }
    });

    it('nomme les filtres chimiques courants et leurs synonymes', () => {
      const lower = CHEMICAL_UV_FILTERS.map((name) => name.toLowerCase());
      for (const name of [
        'octocrylene',
        'butyl methoxydibenzoylmethane',
        'avobenzone',
        'parsol 1789',
        'ethylhexyl methoxycinnamate',
        'octyl methoxycinnamate',
        'octinoxate',
        'benzophenone-1',
        'benzophenone-2',
        'benzophenone-3',
        'benzophenone-4',
        'oxybenzone',
        'homosalate',
        'ethylhexyl salicylate',
        'octyl salicylate',
        'octisalate',
        'ethylhexyl triazone',
        'octyl triazone',
        'tris-biphenyl triazine',
        'bemotrizinol',
        'disodium phenyl dibenzimidazole tetrasulfonate',
        'ethylhexyl dimethyl paba',
        'peg-25 paba',
        'polysilicone-15',
      ]) {
        expect(lower, name).toContain(name);
      }
    });

    it('ne prend pas pour un filtre chimique un ingrédient ordinaire ou le filtre minéral', () => {
      const lower = CHEMICAL_UV_FILTERS.map((name) => name.toLowerCase());
      for (const name of ['zinc oxide', 'titanium dioxide', 'glycerin', 'aqua', 'tocopherol']) {
        expect(lower, name).not.toContain(name);
      }
    });

    it('reconnaît CI 77891 comme dioxyde de titane et CI 77947 comme oxyde de zinc', () => {
      const card = cardOf(reactive, 'sunscreen');
      for (const entry of [
        'CI 77891',
        'CI 77891 (Titanium Dioxide)',
        'ci 77891 [nano]',
        'CI 77947',
        'CI 77947 (Zinc Oxide)',
      ]) {
        const product = altered('sunscreen-50-mineral', { inci: ['Aqua', entry] });
        expect(examplesFor(card, reactive, [product]), entry).toEqual([product]);
      }
      const hybridCi = altered('sunscreen-50-mineral', {
        inci: ['Aqua', 'CI 77891', 'Octocrylene'],
      });
      expect(examplesFor(card, reactive, [hybridCi])).toEqual([]);
      const otherCi = altered('sunscreen-50-mineral', { inci: ['Aqua', 'CI 77491'] });
      expect(examplesFor(card, reactive, [otherCi])).toEqual([]);
    });

    it('exige toujours un filtre minéral pour une peau réactive', () => {
      const none = altered('sunscreen-50-mineral', { inci: ['Aqua', 'Glycerin'] });
      expect(examplesFor(cardOf(reactive, 'sunscreen'), reactive, [none])).toEqual([]);
    });
  });

  describe('huiles essentielles', () => {
    const reactive = profileFor({ ...OILY, reactions: 'often', concern: 'blemishes' });
    const calm = profileFor({ ...OILY, concern: 'blemishes' });
    const oil = 'Lavandula Angustifolia (Lavender) Oil';

    it('écarte pour une peau réactive un produit à l’huile essentielle, sur chaque carte', () => {
      for (const key of ['serum', 'evening', 'cleanser', 'moisturiser', 'sunscreen']) {
        for (const profile of [reactive, calm]) {
          const card = cardOf(profile, key);
          const [plain] = examplesFor(card, profile, FIXTURE_CATALOGUE);
          expect(plain, `${key} : un produit de base`).toBeDefined();
          const scented = { ...plain, id: `${plain.id}-huile`, inci: [...plain.inci, oil] };
          const shown = ids(examplesFor(card, profile, [scented]));
          // Contrôle négatif : sans la réaction, le même produit reste proposé.
          expect(shown, `${key}, ${profile.reactive ? 'réactive' : 'calme'}`).toEqual(
            profile.reactive ? [] : [scented.id],
          );
        }
      }
    });

    it('garde les produits sans huile essentielle pour une peau réactive', () => {
      const serum = examplesFor(cardOf(reactive, 'serum'), reactive, FIXTURE_CATALOGUE);
      expect(ids(serum)).toContain('serum-niacinamide');
      expect(ids(serum)).not.toContain('serum-niacinamide-huile-essentielle');
      const calmSerum = examplesFor(cardOf(calm, 'serum'), calm, FIXTURE_CATALOGUE);
      expect(ids(calmSerum)).toContain('serum-niacinamide-huile-essentielle');
    });

    it('écarte l’huile essentielle même suivie d’une précision ou écrite en majuscules', () => {
      const card = cardOf(reactive, 'serum');
      for (const entry of [
        `${oil} [bio]`,
        oil.toUpperCase(),
        'Huile Essentielle de lavande',
        'Lavandula Angustifolia Oil*',
        'Lavandula Angustifolia (Lavender) Oil.',
      ]) {
        const scented = altered('serum-niacinamide', { inci: ['Aqua', 'Niacinamide', entry] });
        expect(examplesFor(card, reactive, [scented]), entry).toEqual([]);
      }
    });

    it('écarte aussi le parfum, qui reste exclu', () => {
      const card = cardOf(reactive, 'serum');
      const parfum = altered('serum-niacinamide', { inci: ['Aqua', 'Niacinamide', 'Parfum'] });
      expect(examplesFor(card, reactive, [parfum])).toEqual([]);
    });

    it('reconnaît les huiles essentielles de plantes aromatiques', () => {
      const essential = [
        'Lavandula Angustifolia (Lavender) Oil',
        'Lavandula Hybrida Oil',
        'Mentha Piperita (Peppermint) Oil',
        'Rosmarinus Officinalis (Rosemary) Leaf Oil',
        'Melaleuca Alternifolia (Tea Tree) Leaf Oil',
        'Eucalyptus Globulus Leaf Oil',
        'Cymbopogon Schoenanthus Oil',
        'Pelargonium Graveolens Flower Oil',
        'Cananga Odorata Flower Oil',
        'Ylang Ylang Oil',
        'Santalum Album (Sandalwood) Oil',
        'Juniperus Communis Fruit Oil',
        'Thymus Vulgaris (Thyme) Oil',
        'Salvia Sclarea (Clary) Oil',
        'Origanum Vulgare Oil',
        'Cinnamomum Zeylanicum Bark Oil',
        'Syzygium Aromaticum (Clove) Flower Oil',
        'Boswellia Carterii Oil',
        'Citrus Aurantium Dulcis (Orange) Peel Oil',
        'Citrus Limon (Lemon) Peel Oil',
        'Citrus Aurantium Amara (Bitter Orange) Flower Oil',
        'Rosa Damascena Flower Oil',
        'Jasminum Officinale (Jasmine) Oil',
        'Chamomilla Recutita (Matricaria) Flower Oil',
        'Matricaria Chamomilla Flower Oil',
        'Essential Oil',
        'Lavender Essential Oil',
        'Huile essentielle de lavande',
        'Lavandula Angustifolia Oil*',
        'Lavandula Angustifolia (Lavender) Oil.',
        'Lavandula Angustifolia (Lavender) Oil *',
        '*Lavandula Angustifolia Oil',
        'Eugenia Caryophyllus (Clove) Bud Oil',
        'Pinus Sylvestris Leaf Oil',
        'Rosa Centifolia Flower Oil',
        'Anthemis Nobilis Flower Oil',
        'Zingiber Officinale (Ginger) Root Oil',
        'Ocimum Basilicum (Basil) Oil',
        'Piper Nigrum (Pepper) Fruit Oil',
        'Citrus Sinensis (Orange) Oil',
        'Citrus Aurantium Bergamia (Bergamot) Fruit Oil',
        'Tea Tree Oil',
        'Lavender Oil',
        'Peppermint Oil',
        'Eucalyptus Oil',
      ];
      for (const entry of essential) {
        expect(ESSENTIAL_OIL.test(normalise(entry)), entry).toBe(true);
      }
    });

    it('ne prend pas pour une huile essentielle les huiles végétales ni les autres ingrédients', () => {
      const carrier = [
        'Helianthus Annuus (Sunflower) Seed Oil',
        'Simmondsia Chinensis (Jojoba) Seed Oil',
        'Prunus Amygdalus Dulcis (Sweet Almond) Oil',
        'Squalane',
        'Caprylic/Capric Triglyceride',
        'Rosa Canina Fruit Oil',
        'Butyrospermum Parkii (Shea) Butter',
        'Lavandula Angustifolia (Lavender) Flower Extract',
        'Mentha Piperita (Peppermint) Leaf Extract',
        'Citrus Grandis (Grapefruit) Seed Extract',
        'Salvia Hispanica Seed Oil',
        'Mineral Oil',
        'Glycerin',
        'Aqua',
        'Argania Spinosa Kernel Oil',
        'Argania Spinosa Kernel Oil*',
        'Olea Europaea Fruit Oil',
        'Helianthus Annuus Seed Oil.',
        'Simmondsia Chinensis (Jojoba) Seed Oil *',
        'Prunus Amygdalus Dulcis (Sweet Almond) Oil',
        'Citrus Paradisi (Grapefruit) Seed Oil',
        'Orange Seed Oil',
        'Lemon Seed Oil',
        'Citrus Sinensis (Orange) Seed Oil',
        'Pinus Pinaster Bark Extract',
        'Piper Methysticum Root Extract',
        'Sweet Almond Oil',
      ];
      for (const entry of carrier) {
        expect(ESSENTIAL_OIL.test(normalise(entry)), entry).toBe(false);
      }
      const card = cardOf(reactive, 'serum');
      for (const entry of carrier) {
        const plain = altered('serum-niacinamide', { inci: ['Aqua', 'Niacinamide', entry] });
        expect(examplesFor(card, reactive, [plain]), entry).toEqual([plain]);
      }
    });
  });

  it('reconnaît un repère d’étiquette suivi d’une précision au nettoyant', () => {
    const oily = profileFor({ ...OILY, concern: 'none' });
    const qualified = altered('cleanser-zinc', { inci: ['Aqua', 'Glycerin (vegetable)'] });
    expect(examplesFor(cardOf(oily, 'cleanser'), oily, [qualified])).toEqual([qualified]);
  });

  it('écarte un parfum suivi de * ou d’un point, ou précédé d’un *', () => {
    const profile = profileFor({ ...OILY, reactions: 'often', concern: 'blemishes' });
    const card = cardOf(profile, 'serum');
    for (const word of ['Parfum*', 'Fragrance.', 'PARFUM *', '*Parfum', 'Parfum (Fragrance)*']) {
      const scented = altered('serum-niacinamide', { inci: ['Aqua', 'Niacinamide', word] });
      expect(examplesFor(card, profile, [scented]), word).toEqual([]);
    }
  });

  it('ignore un * ou un point final dans les comparaisons d’INCI (actif, repère, filtre minéral)', () => {
    const marked = altered('serum-niacinamide', { inci: ['Aqua', 'Niacinamide*'] });
    expect(catalogueDefects([marked])).toEqual([]);
    const dotted = altered('serum-niacinamide', { inci: ['Aqua', 'Niacinamide.'] });
    expect(catalogueDefects([dotted])).toEqual([]);
    const oily = profileFor({ ...OILY, concern: 'none' });
    const label = altered('cleanser-zinc', { inci: ['Aqua', 'Glycerin*'] });
    expect(examplesFor(cardOf(oily, 'cleanser'), oily, [label])).toEqual([label]);
    const reactive = profileFor({ reactions: 'often', outdoors: 'daily' });
    const mineral = altered('sunscreen-50-mineral', { inci: ['Aqua', 'Zinc Oxide*'] });
    expect(examplesFor(cardOf(reactive, 'sunscreen'), reactive, [mineral])).toEqual([mineral]);
    const chemical = altered('sunscreen-50-mineral', {
      inci: ['Aqua', 'Zinc Oxide', 'Octocrylene*'],
    });
    expect(examplesFor(cardOf(reactive, 'sunscreen'), reactive, [chemical])).toEqual([]);
  });

  it('écarte aussi Fragrance (Parfum) et Parfum (Fragrance) pour une peau réactive', () => {
    const profile = profileFor({ ...OILY, reactions: 'often', concern: 'blemishes' });
    const card = cardOf(profile, 'serum');
    for (const word of ['Fragrance (Parfum)', 'Parfum (Fragrance)']) {
      const scented = altered('serum-niacinamide', { inci: ['Aqua', 'Niacinamide', word] });
      expect(examplesFor(card, profile, [scented])).toEqual([]);
    }
  });

  it('exige au moins un repère d’étiquette de la carte au nettoyant', () => {
    const oily = profileFor({ ...OILY, concern: 'none' });
    expect(oily.type).toBe('oily');
    expect(ids(examplesFor(cardOf(oily, 'cleanser'), oily, FIXTURE_CATALOGUE))).toEqual([
      'cleanser-zinc',
      'cleanser-parfum',
    ]);
    const dry = profileFor({
      afterWash: 'dry',
      evening: 'dry',
      pores: 'normal',
      reactions: 'never',
    });
    expect(dry.type).toBe('dry');
    expect(ids(examplesFor(cardOf(dry, 'cleanser'), dry, FIXTURE_CATALOGUE))).toEqual([
      'cleanser-zinc',
      'cleanser-coco',
      'cleanser-parfum',
    ]);
  });

  it('exige au moins un repère d’étiquette de la carte à l’hydratant', () => {
    const dry = profileFor({
      afterWash: 'dry',
      evening: 'dry',
      pores: 'normal',
      reactions: 'never',
    });
    expect(dry.rich).toBe(true);
    expect(ids(examplesFor(cardOf(dry, 'moisturiser'), dry, FIXTURE_CATALOGUE))).toEqual([
      'moisturiser-rich',
    ]);
    const light = profileFor({ ...OILY });
    expect(light.rich).toBe(false);
    expect(ids(examplesFor(cardOf(light, 'moisturiser'), light, FIXTURE_CATALOGUE))).toEqual([
      'moisturiser-light',
      'moisturiser-parfum',
    ]);
  });

  it('accepte une crème riche au squalane seul, ou aux seuls céramides AP ou EOP', () => {
    for (const rich of [
      ['Aqua', 'Squalane'],
      ['Aqua', 'Ceramide AP'],
      ['Aqua', 'CERAMIDE EOP'],
    ]) {
      expect(catalogueDefects([altered('moisturiser-rich', { inci: rich })])).toEqual([]);
    }
  });

  it('ne montre jamais une crème riche sur la carte légère, ni une légère sur la riche', () => {
    // Une crème riche qui porte aussi les repères de la carte légère (glycérine, hyaluronate).
    const both = ['Aqua', 'Glycerin', 'Sodium Hyaluronate', 'Ceramide NP', 'Squalane'];
    const rich = altered('moisturiser-rich', { id: 'rich-both', inci: both });
    const light = altered('moisturiser-light', { id: 'light-both', inci: both });
    const dry = profileFor({ afterWash: 'dry', evening: 'dry', pores: 'normal' });
    expect(dry.rich).toBe(true);
    expect(ids(examplesFor(cardOf(dry, 'moisturiser'), dry, [light, rich]))).toEqual(['rich-both']);
    const oily = profileFor({ ...OILY });
    expect(oily.rich).toBe(false);
    expect(ids(examplesFor(cardOf(oily, 'moisturiser'), oily, [rich, light]))).toEqual([
      'light-both',
    ]);
  });

  it('compare les repères d’étiquette sans tenir compte de la casse', () => {
    const profile = profileFor({ ...OILY });
    const shouting = altered('cleanser-zinc', { inci: ['AQUA', 'GLYCERIN'] });
    expect(examplesFor(cardOf(profile, 'cleanser'), profile, [shouting])).toEqual([shouting]);
  });

  it('propose au plus trois exemples, dans l’ordre du catalogue', () => {
    const profile = profileFor({ ...OILY, concern: 'blemishes' });
    const card = cardOf(profile, 'serum');
    const many = ['a', 'b', 'c', 'd', 'e'].map((id) => altered('serum-niacinamide', { id }));
    expect(ids(examplesFor(card, profile, many))).toEqual(['a', 'b', 'c']);
    expect(ids(examplesFor(card, profile, [...many].reverse()))).toEqual(['e', 'd', 'c']);
  });
});
