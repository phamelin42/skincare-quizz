import { INGREDIENTS } from './content';
import {
  CATALOGUE,
  catalogueDefects,
  CHEMICAL_UV_FILTERS,
  ESSENTIAL_OIL,
  examplesFor,
  normalise,
  type Product,
} from './products';
import { FIXTURE_CATALOGUE } from './products.fixture';
import { analyse, type Answers, ingredients, products, routine } from './profile';
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

/** Toutes les combinaisons de réponses possibles. */
function* everyAnswers(index = 0, prefix: number[] = []): Generator<Answers> {
  if (index === QUESTIONS.length) {
    yield prefix;
    return;
  }
  for (let option = 0; option < QUESTIONS[index].options.length; option++) {
    yield* everyAnswers(index + 1, [...prefix, option]);
  }
}

describe('analyse', () => {
  it('reconnaît chaque type de peau quand les réponses concordent', () => {
    for (const type of ['dry', 'oily', 'combination', 'normal'] as const) {
      const pores = type === 'dry' ? 'normal' : type;
      expect(analyse(answers({ afterWash: type, evening: type, pores })).type).toBe(type);
    }
  });

  it('voit une peau mixte dans des réponses à la fois sèches et grasses', () => {
    expect(analyse(answers({ afterWash: 'dry', evening: 'oily', pores: 'normal' })).type).toBe(
      'combination',
    );
  });

  it('laisse les pores départager deux réponses différentes', () => {
    expect(analyse(answers({ afterWash: 'normal', evening: 'oily', pores: 'oily' })).type).toBe(
      'oily',
    );
  });

  it('considère la peau réactive dès que rougeurs ou picotements arrivent parfois', () => {
    expect(analyse(answers({ reactions: 'often' })).reactive).toBe(true);
    expect(analyse(answers({ reactions: 'sometimes' })).reactive).toBe(true);
    expect(analyse(answers({ reactions: 'never' })).reactive).toBe(false);
  });

  it('ajoute les imperfections fréquentes après la priorité choisie', () => {
    const profile = analyse(answers({ concern: 'spots', breakouts: 'often' }));
    expect(profile.concerns).toEqual(['spots', 'blemishes']);
    expect(analyse(answers({ concern: 'blemishes', breakouts: 'often' })).concerns).toEqual([
      'blemishes',
    ]);
    expect(analyse(answers({ concern: 'none', breakouts: 'rarely' })).concerns).toEqual([]);
  });

  it('choisit le sérum selon la priorité, sinon selon le type de peau', () => {
    const serum = (values: Partial<Record<QuestionId, string>>) =>
      analyse(answers({ breakouts: 'rarely', ...values })).serum;
    expect(serum({ concern: 'blemishes' })).toBe('niacinamide');
    expect(serum({ concern: 'spots' })).toBe('vitaminC');
    expect(serum({ concern: 'wrinkles' })).toBe('vitaminC');
    expect(serum({ concern: 'redness' })).toBe('soothing');
    expect(serum({ concern: 'tightness' })).toBe('hyaluronic');
    expect(serum({ concern: 'none', afterWash: 'oily', evening: 'oily' })).toBe('niacinamide');
    expect(serum({ concern: 'none', afterWash: 'dry', evening: 'dry' })).toBe('hyaluronic');
  });

  it('propose un BHA contre les imperfections, l’acide azélaïque si la peau réagit', () => {
    const base = { concern: 'blemishes', breakouts: 'rarely' };
    expect(analyse(answers({ ...base, reactions: 'never' })).evening).toBe('salicylic');
    expect(analyse(answers({ ...base, reactions: 'often' })).evening).toBe('azelaic');
  });

  it('ne propose le rétinol sans priorité qu’à partir de 40 ans', () => {
    const base = { concern: 'none', breakouts: 'rarely' };
    expect(analyse(answers({ ...base, age: 'under25' })).evening).toBeNull();
    expect(analyse(answers({ ...base, age: '25to39' })).evening).toBeNull();
    expect(analyse(answers({ ...base, age: '40to54' })).evening).toBe('retinol');
    expect(analyse(answers({ ...base, age: '55plus' })).evening).toBe('retinol');
    expect(analyse(answers({ concern: 'wrinkles', age: 'under25' })).evening).toBe('retinol');
  });

  it('vise SPF 50 pour qui est dehors presque tous les jours, SPF 30 sinon', () => {
    expect(analyse(answers({ outdoors: 'daily' })).spf).toBe(50);
    expect(analyse(answers({ outdoors: 'sometimes' })).spf).toBe(30);
    expect(analyse(answers({ outdoors: 'rarely' })).spf).toBe(30);
  });
});

describe('produits et routine', () => {
  it('ajoute démaquillant et exfoliation douce à une routine de 10 minutes', () => {
    const keys = products(
      analyse(
        answers({
          time: '10',
          reactions: 'never',
          concern: 'none',
          breakouts: 'rarely',
          age: 'under25',
        }),
      ),
    ).map((card) => card.key);
    expect(keys).toEqual([
      'cleanser',
      'serum',
      'moisturiser',
      'sunscreen',
      'makeupRemover',
      'exfoliant',
    ]);
  });

  it('n’ajoute pas d’exfoliation à une peau réactive ni en plus d’un BHA ou d’un rétinol', () => {
    const keys = (values: Partial<Record<QuestionId, string>>) =>
      products(analyse(answers({ time: '10', breakouts: 'rarely', ...values }))).map((c) => c.key);
    expect(keys({ reactions: 'often', concern: 'none' })).not.toContain('exfoliant');
    expect(keys({ reactions: 'never', concern: 'blemishes' })).not.toContain('exfoliant');
    expect(keys({ reactions: 'never', concern: 'wrinkles' })).not.toContain('exfoliant');
    expect(keys({ reactions: 'never', concern: 'spots' })).toContain('exfoliant');
  });

  it('garde trois étapes sans sérum le matin pour 2 minutes par jour', () => {
    const { morning } = routine(analyse(answers({ time: '2' })));
    expect(morning.map((step) => step.title)).toEqual(['Nettoyer', 'Hydrater', 'Protéger']);
  });

  it('place le soin du soir entre le nettoyant et l’hydratant', () => {
    const { evening } = routine(analyse(answers({ time: '5', concern: 'wrinkles' })));
    expect(evening.map((step) => step.title)).toEqual(['Nettoyer', 'Traiter', 'Hydrater']);
    expect(evening[1].detail).toContain('Rétinol');
  });

  it('donne un résultat complet et sans doublon pour toutes les réponses possibles', () => {
    // Des centaines de milliers de combinaisons : on relève les défauts, puis un seul expect.
    const defects: string[] = [];
    let count = 0;
    for (const combination of everyAnswers()) {
      const profile = analyse(combination);
      const keys = ingredients(profile);
      const cards = products(profile);
      const { morning, evening } = routine(profile);
      const ok =
        keys.length >= 2 &&
        keys.length <= 3 &&
        new Set(keys).size === keys.length &&
        new Set(cards.map((card) => card.key)).size === cards.length &&
        [...morning, ...evening].every((step) => !/undefined|null/.test(step.detail));
      if (!ok && defects.length < 5) defects.push(combination.join(','));
      count++;
    }
    expect(defects).toEqual([]);
    expect(count).toBe(QUESTIONS.reduce((total, q) => total * q.options.length, 1));
  }, 60_000);
});

describe('exemples de produits', () => {
  it('garde un catalogue réel sans défaut', () => {
    expect(catalogueDefects(CATALOGUE)).toEqual([]);
  });

  it('n’affiche que des exemples cohérents avec le profil, pour toutes les réponses', () => {
    const defects: string[] = [];
    const seen = new Set<string>();
    // Ce que le catalogue d’essai peut couvrir : sans cela, un filtre qui ne renvoie rien passerait.
    const reachable = new Set<string>();
    const shown = new Set<string>();
    const mineral = ['zinc oxide', 'titanium dioxide'];
    for (const combination of everyAnswers()) {
      const profile = analyse(combination);
      const signature = JSON.stringify(profile);
      if (seen.has(signature)) continue;
      seen.add(signature);
      for (const card of products(profile)) {
        const coverage = [card.key, profile.reactive ? 'reactive' : 'calm'];
        if (card.key === 'serum') coverage.push(profile.serum);
        if (card.key === 'evening') coverage.push(profile.evening!);
        if (card.key === 'sunscreen') coverage.push(String(profile.spf));
        const examples = examplesFor(card, profile, FIXTURE_CATALOGUE);
        if (FIXTURE_CATALOGUE.some((product) => product.card === card.key)) {
          reachable.add(coverage.join(':'));
        }
        if (examples.length > 3 && defects.length < 5) defects.push(`${card.key} : plus de 3`);
        for (const product of examples) {
          shown.add(coverage.join(':'));
          const inci = product.inci.join('|').toLowerCase();
          const fail = (message: string) => {
            if (defects.length < 5) defects.push(`${product.id} sur ${card.key} : ${message}`);
          };
          if (product.card !== card.key) fail('mauvaise carte');
          if (profile.reactive && /parfum|fragrance/.test(inci)) fail('parfum pour peau réactive');
          const oil = product.inci.find((name) => ESSENTIAL_OIL.test(normalise(name)));
          if (profile.reactive && oil) fail(`huile essentielle (${oil}) pour peau réactive`);
          if (card.key === 'serum' || card.key === 'evening') {
            const active = card.key === 'serum' ? profile.serum : profile.evening;
            if (product.active !== active) fail(`actif ${product.active}, profil ${active}`);
            const known = INGREDIENTS[active!].inci.map((name) => name.toLowerCase());
            if (!known.some((name) => inci.includes(name))) fail('aucun INCI de l’actif');
          }
          if (card.key === 'sunscreen') {
            if (product.spf !== profile.spf) fail(`SPF ${product.spf}, profil ${profile.spf}`);
            if (profile.reactive && !mineral.some((name) => inci.includes(name))) {
              fail('pas de filtre minéral pour peau réactive');
            }
            const hybrid = CHEMICAL_UV_FILTERS.find((name) => inci.includes(name.toLowerCase()));
            if (profile.reactive && hybrid) fail(`écran hybride (${hybrid}) pour peau réactive`);
          }
          if (card.key === 'cleanser' || card.key === 'moisturiser') {
            if (!card.labels.some((label) => inci.includes(label.toLowerCase()))) {
              fail('aucun repère de la carte');
            }
          }
        }
      }
    }
    expect(defects).toEqual([]);
    expect([...reachable].filter((key) => !shown.has(key))).toEqual([]);
    expect(seen.size).toBeGreaterThan(1);
  }, 60_000);

  it('n’affiche jamais un hydratant sans repère de la carte, même au catalogue', () => {
    const bare: Product = {
      ...FIXTURE_CATALOGUE.find((product) => product.card === 'moisturiser')!,
      id: 'moisturiser-bare',
      inci: ['Aqua', 'Dimethicone'],
    };
    const seen = new Set<string>();
    const shown: string[] = [];
    for (const combination of everyAnswers()) {
      const profile = analyse(combination);
      const signature = JSON.stringify(profile);
      if (seen.has(signature)) continue;
      seen.add(signature);
      for (const card of products(profile)) {
        if (examplesFor(card, profile, [bare]).length > 0) shown.push(signature);
      }
    }
    expect(shown).toEqual([]);
  }, 60_000);
});
