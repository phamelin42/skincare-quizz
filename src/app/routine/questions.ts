export interface QuizOption {
  readonly label: string;
  readonly value: string;
}

export interface QuizQuestion {
  readonly id: QuestionId;
  readonly text: string;
  readonly hint: string;
  readonly options: readonly QuizOption[];
}

export type QuestionId =
  | 'afterWash'
  | 'evening'
  | 'pores'
  | 'breakouts'
  | 'reactions'
  | 'concern'
  | 'age'
  | 'outdoors'
  | 'routine'
  | 'time';

export const QUESTIONS: readonly QuizQuestion[] = [
  {
    id: 'afterWash',
    text: 'Quelques heures après avoir lavé votre visage, sans rien appliquer, votre peau…',
    hint: 'Pensez à une journée ordinaire.',
    options: [
      { label: 'Tiraille', value: 'dry' },
      { label: 'Brille sur le front, le nez et le menton', value: 'combination' },
      { label: 'Brille partout', value: 'oily' },
      { label: 'Reste confortable', value: 'normal' },
    ],
  },
  {
    id: 'evening',
    text: 'En fin de journée, votre visage…',
    hint: 'Sans retouche ni maquillage.',
    options: [
      { label: 'Brille partout', value: 'oily' },
      { label: 'Brille surtout au centre', value: 'combination' },
      { label: 'Paraît terne ou rugueux', value: 'dry' },
      { label: 'Ne change pas', value: 'normal' },
    ],
  },
  {
    id: 'pores',
    text: 'Vos pores sont…',
    hint: 'Regardez-vous de près, à la lumière du jour.',
    options: [
      { label: 'Visibles sur tout le visage', value: 'oily' },
      { label: 'Visibles surtout sur le nez', value: 'combination' },
      { label: 'À peine visibles', value: 'normal' },
    ],
  },
  {
    id: 'breakouts',
    text: 'Boutons ou points noirs : vous en avez…',
    hint: '',
    options: [
      { label: 'Souvent', value: 'often' },
      { label: 'De temps en temps', value: 'sometimes' },
      { label: 'Rarement', value: 'rarely' },
    ],
  },
  {
    id: 'reactions',
    text: 'Quand vous essayez un nouveau produit, rougeurs ou picotements…',
    hint: 'Ils indiquent une peau qui réagit facilement.',
    options: [
      { label: 'Arrivent souvent', value: 'often' },
      { label: 'Arrivent parfois', value: 'sometimes' },
      { label: 'N’arrivent jamais', value: 'never' },
    ],
  },
  {
    id: 'concern',
    text: 'Qu’aimeriez-vous améliorer en priorité ?',
    hint: 'Un seul choix, celui qui vous gêne le plus.',
    options: [
      { label: 'Les imperfections', value: 'blemishes' },
      { label: 'Les tiraillements', value: 'tightness' },
      { label: 'Les taches et le teint irrégulier', value: 'spots' },
      { label: 'Les rides et la fermeté', value: 'wrinkles' },
      { label: 'Les rougeurs', value: 'redness' },
      { label: 'Rien de précis, une routine simple', value: 'none' },
    ],
  },
  {
    id: 'age',
    text: 'Quelle est votre tranche d’âge ?',
    hint: 'Elle sert à ajuster la richesse des soins.',
    options: [
      { label: 'Moins de 25 ans', value: 'under25' },
      { label: '25 à 39 ans', value: '25to39' },
      { label: '40 à 54 ans', value: '40to54' },
      { label: '55 ans et plus', value: '55plus' },
    ],
  },
  {
    id: 'outdoors',
    text: 'Combien de temps passez-vous dehors ?',
    hint: 'Hors transports et bureaux, en plein jour.',
    options: [
      { label: 'Presque tous les jours', value: 'daily' },
      { label: 'Quelques fois par semaine', value: 'sometimes' },
      { label: 'Rarement', value: 'rarely' },
    ],
  },
  {
    id: 'routine',
    text: 'Où en êtes-vous de votre routine ?',
    hint: '',
    options: [
      { label: 'Je n’en ai pas', value: 'none' },
      { label: 'Je me lave seulement le visage', value: 'cleanser' },
      { label: 'J’utilise quelques produits', value: 'some' },
      { label: 'J’ai une routine complète', value: 'complete' },
    ],
  },
  {
    id: 'time',
    text: 'Combien de temps voulez-vous y consacrer chaque jour ?',
    hint: 'Une routine tenue vaut mieux qu’une routine parfaite.',
    options: [
      { label: '2 minutes', value: '2' },
      { label: '5 minutes', value: '5' },
      { label: '10 minutes ou plus', value: '10' },
    ],
  },
];
