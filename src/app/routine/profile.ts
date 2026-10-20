import type { FdCardSky, FdEmblemName } from 'fuda';
import {
  type Concern,
  EVENING_FREQUENCY,
  EVENING_TITLES,
  type EveningKey,
  INGREDIENTS,
  type IngredientKey,
  SERUM_NAMES,
  type SerumKey,
  type SkinType,
  type StartKey,
} from './content';
import { type QuestionId, QUESTIONS } from './questions';

export type RoutineTime = '2' | '5' | '10';

export interface Profile {
  readonly type: SkinType;
  /** Rougeurs ou picotements, souvent ou parfois, avec un nouveau produit. */
  readonly reactive: boolean;
  /** Par ordre de priorité : le choix de la question, puis les imperfections fréquentes. */
  readonly concerns: readonly Concern[];
  readonly serum: SerumKey;
  readonly evening: EveningKey | null;
  readonly rich: boolean;
  readonly spf: 30 | 50;
  readonly time: RoutineTime;
  readonly start: StartKey;
}

export interface ProductCard {
  readonly key: string;
  readonly when: string;
  readonly sky: FdCardSky;
  readonly emblem: FdEmblemName;
  readonly title: string;
  readonly texture: string;
  readonly text: string;
  /** À chercher sur l’étiquette. */
  readonly labels: readonly string[];
}

export interface RoutineStep {
  readonly title: string;
  readonly detail: string;
  readonly duration: string;
}

export interface Routine {
  readonly morning: readonly RoutineStep[];
  readonly evening: readonly RoutineStep[];
}

/** Une réponse par question, dans l’ordre de `QUESTIONS` : l’indice de l’option choisie. */
export type Answers = readonly number[];

const TYPE_ORDER: readonly SkinType[] = ['combination', 'oily', 'dry', 'normal'];

const SERUM_FOR: Record<Concern, SerumKey> = {
  blemishes: 'niacinamide',
  spots: 'vitaminC',
  wrinkles: 'vitaminC',
  redness: 'soothing',
  tightness: 'hyaluronic',
};

export function analyse(answers: Answers): Profile {
  const value = (id: QuestionId): string => {
    const index = QUESTIONS.findIndex((question) => question.id === id);
    return QUESTIONS[index].options[answers[index]].value;
  };

  // Les deux premières questions décrivent directement le sébum ; les pores ne font que départager.
  const scores: Record<SkinType, number> = { combination: 0, oily: 0, dry: 0, normal: 0 };
  scores[value('afterWash') as SkinType] += 2;
  scores[value('evening') as SkinType] += 2;
  scores[value('pores') as SkinType] += 1;
  const max = Math.max(...Object.values(scores));
  const top = TYPE_ORDER.filter((type) => scores[type] === max);
  // Des réponses à la fois sèches et grasses décrivent une peau mixte.
  const type = top.includes('dry') && top.includes('oily') ? 'combination' : top[0];

  const reactive = value('reactions') !== 'never';
  const concerns: Concern[] = [];
  const concern = value('concern');
  if (concern !== 'none') concerns.push(concern as Concern);
  if (value('breakouts') === 'often' && !concerns.includes('blemishes')) {
    concerns.push('blemishes');
  }

  const oily = type === 'oily' || type === 'combination';
  const serum = concerns.length > 0 ? SERUM_FOR[concerns[0]] : oily ? 'niacinamide' : 'hyaluronic';

  const age = value('age');
  const mature = age === '40to54' || age === '55plus';
  const eveningFor: Partial<Record<Concern, EveningKey>> = {
    // L’acide azélaïque est en général mieux toléré qu’un BHA par une peau réactive.
    blemishes: reactive ? 'azelaic' : 'salicylic',
    spots: 'azelaic',
    redness: 'azelaic',
    wrinkles: 'retinol',
  };
  let evening = concerns.map((c) => eveningFor[c]).find((key) => key !== undefined) ?? null;
  if (!evening && mature && concerns.length === 0) evening = 'retinol';

  return {
    type,
    reactive,
    concerns,
    serum,
    evening,
    rich: type === 'dry' || mature,
    spf: value('outdoors') === 'daily' ? 50 : 30,
    time: value('time') as RoutineTime,
    start: value('routine') as StartKey,
  };
}

export function products(profile: Profile): ProductCard[] {
  const { type, reactive, rich } = profile;
  const fragranceFree = reactive ? ['Sans parfum'] : [];
  const cleanserTexture: Record<SkinType, string> = {
    dry: 'Crème ou lait nettoyant',
    normal: 'Gel ou crème douce',
    combination: 'Gel ou mousse douce',
    oily: 'Gel nettoyant doux',
  };
  const serum = INGREDIENTS[profile.serum];

  const list: ProductCard[] = [
    {
      key: 'cleanser',
      when: 'Matin et soir',
      sky: 'asagi',
      emblem: 'koi',
      title: 'Un nettoyant doux sans savon',
      texture: cleanserTexture[type],
      text: 'Retire le sébum, la pollution et l’écran solaire sans décaper. Rincez à l’eau tiède, 30 secondes.',
      labels:
        type === 'oily'
          ? ['Glycerin', 'Zinc PCA', ...fragranceFree]
          : ['Glycerin', 'Coco-Glucoside', ...fragranceFree],
    },
    {
      key: 'serum',
      when: 'Matin',
      sky: 'fuji',
      emblem: 'fuji',
      title: `Un sérum ${SERUM_NAMES[profile.serum]}`,
      texture: serum.dose
        ? `Concentration courante\u00a0: ${serum.dose}`
        : 'Texture fluide, sans parfum',
      text: serum.why,
      labels: serum.inci,
    },
  ];

  if (profile.evening) {
    const active = INGREDIENTS[profile.evening];
    list.push({
      key: 'evening',
      when: 'Soir',
      sky: 'kon',
      emblem: 'usagi',
      title: EVENING_TITLES[profile.evening],
      texture: `Concentration courante\u00a0: ${active.dose}`,
      text: active.why,
      labels: active.inci,
    });
  }

  list.push(
    {
      key: 'moisturiser',
      when: 'Matin et soir',
      sky: 'sakura',
      emblem: 'sakura',
      title: rich ? 'Une crème hydratante riche' : 'Une crème hydratante légère',
      texture: moisturiserTexture(profile),
      text: rich
        ? 'Garde l’eau dans la peau et limite les tiraillements. Appliquez-la sur peau encore légèrement humide.'
        : 'Apporte l’eau et le confort sans laisser de film gras. Appliquez-la sur peau encore légèrement humide.',
      labels: [
        rich ? 'Ceramide NP' : 'Glycerin',
        rich ? 'Squalane' : 'Sodium Hyaluronate',
        ...(reactive ? ['Panthenol'] : []),
      ],
    },
    {
      key: 'sunscreen',
      when: 'Matin',
      sky: 'yamabuki',
      emblem: 'kiku',
      title: `Un écran solaire SPF ${profile.spf}`,
      texture: type === 'dry' ? 'Crème solaire confortable' : 'Fluide léger, fini non gras',
      text:
        profile.spf === 50
          ? 'Vous êtes souvent dehors : visez SPF 50, large spectre. Renouvelez toutes les deux heures au soleil.'
          : 'SPF 30 au minimum, large spectre. Renouvelez toutes les deux heures au soleil.',
      labels: reactive ? ['Zinc Oxide', 'Titanium Dioxide'] : ['Large spectre', 'Logo UVA cerclé'],
    },
  );

  if (profile.time === '10') {
    list.push({
      key: 'makeupRemover',
      when: 'Soir',
      sky: 'asagi',
      emblem: 'tsubame',
      title: 'Une huile ou un baume démaquillant',
      texture: 'Se rince à l’eau',
      text: 'Retire d’abord l’écran solaire et le maquillage, avant le nettoyant. Un premier temps qui laisse la peau plus propre.',
      labels: ['Caprylic/Capric Triglyceride'],
    });
    // Pas d’exfoliant en plus d’un BHA ou d’un rétinol, ni sur une peau réactive.
    if (!reactive && profile.evening !== 'salicylic' && profile.evening !== 'retinol') {
      const bha = type === 'oily' || type === 'combination';
      list.push({
        key: 'exfoliant',
        when: 'Une fois par semaine',
        sky: 'tokiwa',
        emblem: 'momiji',
        title: 'Une exfoliation chimique douce',
        texture: bha ? 'Lotion ou gel à rincer, non frottant' : 'Lotion douce, non frottante',
        text: 'Les acides font le travail sans grain abrasif. Pas plus d’une fois par semaine, jamais le même soir que le soin du soir.',
        labels: [bha ? 'Salicylic Acid' : 'Lactic Acid'],
      });
    }
  }
  return list;
}

function moisturiserTexture(profile: Profile): string {
  if (profile.rich) return 'Crème confortable, texture riche';
  return profile.type === 'oily' ? 'Gel-crème léger, non gras' : 'Crème légère';
}

export function routine(profile: Profile): Routine {
  const cards = new Map(products(profile).map((card) => [card.key, card]));
  const step = {
    cleanser: {
      title: 'Nettoyer',
      detail: `${cards.get('cleanser')?.texture}, 30 secondes, eau tiède.`,
      duration: '30 s',
    },
    serum: {
      title: 'Sérum',
      detail: `Sérum ${SERUM_NAMES[profile.serum]}, quelques gouttes sur peau propre.`,
      duration: '20 s',
    },
    moisturiser: {
      title: 'Hydrater',
      detail: `${moisturiserTexture(profile)}.`,
      duration: '20 s',
    },
    sunscreen: {
      title: 'Protéger',
      detail: `SPF ${profile.spf}, deux doigts de produit sur le visage et le cou, en dernière étape.`,
      duration: '30 s',
    },
    makeupRemover: {
      title: 'Démaquiller',
      detail: 'Un massage de 30 secondes sur peau sèche, puis rincez à l’eau.',
      duration: '40 s',
    },
  } satisfies Record<string, RoutineStep>;

  const morning =
    profile.time === '2'
      ? [step.cleanser, step.moisturiser, step.sunscreen]
      : [step.cleanser, step.serum, step.moisturiser, step.sunscreen];
  const evening: RoutineStep[] = profile.time === '10' ? [step.makeupRemover] : [];
  evening.push(step.cleanser);
  if (profile.evening) {
    evening.push({
      title: 'Traiter',
      detail: `${INGREDIENTS[profile.evening].name}. ${EVENING_FREQUENCY[profile.evening]} Avant l’hydratant.`,
      duration: '20 s',
    });
  }
  evening.push(step.moisturiser);
  return { morning, evening };
}

/** Deux ou trois ingrédients à repérer, sans doublon. */
export function ingredients(profile: Profile): IngredientKey[] {
  const keys: IngredientKey[] = [profile.serum];
  if (profile.evening) keys.push(profile.evening);
  if (profile.rich) keys.push('ceramides');
  const unique = [...new Set(keys)].slice(0, 3);
  if (unique.length < 2) {
    const fallbacks: IngredientKey[] = profile.rich
      ? ['ceramides', 'hyaluronic']
      : ['hyaluronic', 'ceramides'];
    unique.push(fallbacks.find((key) => !unique.includes(key))!);
  }
  return unique;
}
