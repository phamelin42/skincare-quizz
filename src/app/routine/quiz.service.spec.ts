import { TestBed } from '@angular/core/testing';
import { QUESTIONS } from './questions';
import { ANALYSIS_DELAY, ANSWER_DELAY, QuizService } from './quiz.service';

describe('QuizService', () => {
  let quiz: QuizService;

  beforeEach(() => {
    vi.useFakeTimers();
    quiz = TestBed.inject(QuizService);
  });

  afterEach(() => vi.useRealTimers());

  function answerAll(option = 0): void {
    QUESTIONS.forEach(() => {
      quiz.choose(option);
      vi.advanceTimersByTime(ANSWER_DELAY);
    });
  }

  it('commence par l’accueil, puis la première question', () => {
    expect(quiz.screen()).toBe('home');
    quiz.start();
    expect(quiz.screen()).toBe('quiz');
    expect(quiz.question()).toBe(QUESTIONS[0]);
    expect(quiz.progress()).toBe(0);
  });

  it('coche la réponse, puis passe à la question suivante après un court instant', () => {
    quiz.start();
    quiz.choose(2);
    expect(quiz.selected()).toBe(2);
    expect(quiz.index()).toBe(0);
    vi.advanceTimersByTime(ANSWER_DELAY);
    expect(quiz.index()).toBe(1);
    expect(quiz.progress()).toBe(10);
  });

  it('ignore un second choix pendant la transition et une option inexistante', () => {
    quiz.start();
    quiz.choose(9);
    expect(quiz.selected()).toBeNull();
    quiz.choose(0);
    quiz.choose(1);
    expect(quiz.selected()).toBe(0);
    vi.advanceTimersByTime(ANSWER_DELAY);
    expect(quiz.index()).toBe(1);
  });

  it('revient à la question précédente en annulant la transition en cours', () => {
    quiz.start();
    quiz.choose(0);
    vi.advanceTimersByTime(ANSWER_DELAY);
    quiz.choose(1);
    quiz.back();
    vi.advanceTimersByTime(ANSWER_DELAY);
    expect(quiz.index()).toBe(0);
    expect(quiz.selected()).toBe(0);
  });

  it('analyse les réponses puis affiche le résultat', () => {
    quiz.start();
    answerAll();
    expect(quiz.screen()).toBe('analysis');
    expect(quiz.result()).toBeNull();
    vi.advanceTimersByTime(ANALYSIS_DELAY);
    expect(quiz.screen()).toBe('result');
    // Première option partout : « Tiraille », « Brille partout », pores visibles partout.
    expect(quiz.result()?.profile.type).toBe('oily');
  });

  it('garde les réponses pour les modifier, les efface pour recommencer', () => {
    quiz.start();
    answerAll(1);
    vi.advanceTimersByTime(ANALYSIS_DELAY);

    quiz.edit();
    expect(quiz.screen()).toBe('quiz');
    expect(quiz.index()).toBe(0);
    expect(quiz.selected()).toBe(1);

    quiz.restart();
    expect(quiz.screen()).toBe('home');
    expect(quiz.answers().every((answer) => answer === null)).toBe(true);
  });

  it('n’affiche pas de résultat qui arriverait après un retour à l’accueil', () => {
    quiz.start();
    answerAll();
    quiz.restart();
    vi.advanceTimersByTime(ANALYSIS_DELAY);
    expect(quiz.screen()).toBe('home');
  });
});
