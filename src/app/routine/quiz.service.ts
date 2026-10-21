import { computed, inject, Service, signal } from '@angular/core';
import { RETINOL_NOTE } from './content';
import { examplesFor, PRODUCT_CATALOGUE } from './products';
import { type Answers, analyse, ingredients, products, routine } from './profile';
import { QUESTIONS } from './questions';

export type Screen = 'home' | 'quiz' | 'analysis' | 'result';

/** Le temps de voir la réponse cochée avant la question suivante. */
export const ANSWER_DELAY = 200;
/** Durée de l’écran « Analyse de vos réponses… ». */
export const ANALYSIS_DELAY = 1400;

const noAnswers = (): (number | null)[] => QUESTIONS.map(() => null);

/** Parcours du questionnaire : rien n’est enregistré, tout vit en mémoire. */
@Service()
export class QuizService {
  readonly questions = QUESTIONS;

  private readonly catalogue = inject(PRODUCT_CATALOGUE);

  private readonly screenState = signal<Screen>('home');
  private readonly indexState = signal(0);
  private readonly answersState = signal<readonly (number | null)[]>(noAnswers());
  private timer: ReturnType<typeof setTimeout> | undefined;

  readonly screen = this.screenState.asReadonly();
  readonly index = this.indexState.asReadonly();
  readonly answers = this.answersState.asReadonly();
  readonly question = computed(() => QUESTIONS[this.indexState()]);
  /** Part des questions précédentes déjà répondues, de 0 à 100. */
  readonly progress = computed(() => {
    const answered = this.answersState()
      .slice(0, this.indexState())
      .filter((answer) => answer !== null).length;
    return Math.round((answered * 100) / QUESTIONS.length);
  });
  readonly selected = computed(() => this.answersState()[this.indexState()]);

  readonly result = computed(() => {
    const answers = this.answersState();
    if (this.screenState() !== 'result' || answers.some((answer) => answer === null)) return null;
    const profile = analyse(answers as Answers);
    return {
      profile,
      products: products(profile).map((card) => {
        const examples = examplesFor(card, profile, this.catalogue);
        // Le rappel suit les exemples : sans produit de rétinol à montrer, il n’a rien à accompagner.
        const retinol = card.key === 'evening' && profile.evening === 'retinol';
        return { ...card, examples, note: retinol && examples.length > 0 ? RETINOL_NOTE : null };
      }),
      routine: routine(profile),
      ingredients: ingredients(profile),
    };
  });

  start(): void {
    this.cancel();
    this.indexState.set(0);
    this.screenState.set('quiz');
  }

  /** Coche la réponse, puis passe à la question suivante ou à l’analyse. */
  choose(option: number): void {
    if (this.timer !== undefined || this.screenState() !== 'quiz') return;
    const index = this.indexState();
    if (option < 0 || option >= QUESTIONS[index].options.length) return;
    this.answersState.update((answers) => answers.map((a, i) => (i === index ? option : a)));
    this.timer = setTimeout(() => {
      this.timer = undefined;
      if (index < QUESTIONS.length - 1) {
        this.indexState.set(index + 1);
      } else if (this.answersState().every((answer) => answer !== null)) {
        this.analyse();
      }
    }, ANSWER_DELAY);
  }

  back(): void {
    this.cancel();
    this.indexState.update((index) => Math.max(0, index - 1));
  }

  restart(): void {
    this.cancel();
    this.answersState.set(noAnswers());
    this.indexState.set(0);
    this.screenState.set('home');
  }

  /** Revient à la première question en gardant les réponses. */
  edit(): void {
    this.start();
  }

  private analyse(): void {
    this.screenState.set('analysis');
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.screenState.set('result');
    }, ANALYSIS_DELAY);
  }

  private cancel(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
  }
}
