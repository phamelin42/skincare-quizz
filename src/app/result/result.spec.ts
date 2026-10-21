import { TestBed } from '@angular/core/testing';
import { Result } from './result';
import { PRODUCT_CATALOGUE } from '../routine/products';
import { FIXTURE_CATALOGUE } from '../routine/products.fixture';
import { RETINOL_NOTE } from '../routine/content';
import { type QuestionId, QUESTIONS } from '../routine/questions';
import { ANALYSIS_DELAY, ANSWER_DELAY, QuizService } from '../routine/quiz.service';

describe('Result', () => {
  afterEach(() => vi.useRealTimers());

  /** Première option partout : peau grasse, sérum à la niacinamide (voir quiz.service.spec.ts). */
  async function render(
    catalogue: readonly (typeof FIXTURE_CATALOGUE)[number][],
    values: Partial<Record<QuestionId, string>> = {},
  ) {
    TestBed.configureTestingModule({
      providers: [{ provide: PRODUCT_CATALOGUE, useValue: catalogue }],
    });
    const quiz = TestBed.inject(QuizService);
    // Les minuteries du parcours sont simulées ; le rendu, lui, attend de vraies minuteries.
    vi.useFakeTimers();
    quiz.start();
    QUESTIONS.forEach((question) => {
      const index = question.options.findIndex((option) => option.value === values[question.id]);
      quiz.choose(Math.max(index, 0));
      vi.advanceTimersByTime(ANSWER_DELAY);
    });
    vi.advanceTimersByTime(ANALYSIS_DELAY);
    vi.useRealTimers();
    const fixture = TestBed.createComponent(Result);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('n’affiche aucun exemple quand le catalogue est vide', async () => {
    const element = await render([]);
    expect(element.querySelector('app-examples')).toBeNull();
    expect(element.textContent).not.toContain('Exemples sur Amazon');
  });

  it('affiche les exemples sous la carte concernée, sans mention d’affiliation (décision de Phil du 21/10/2026)', async () => {
    const serum = FIXTURE_CATALOGUE.filter((product) => product.id === 'serum-niacinamide');
    const element = await render(serum);

    const blocks = [...element.querySelectorAll('app-examples')];
    expect(blocks).toHaveLength(1);
    const card = blocks[0].closest('article')!;
    expect(card.querySelector('[slot="title"]')?.textContent).toMatch(/sérum/i);
    expect(blocks[0].querySelector('a')?.textContent).toContain('serum-niacinamide');

    const text = element.textContent!.replace(/[ \t\n]+/g, ' ');
    expect(text).not.toContain('Partenaire Amazon');
    expect(text).not.toContain('sans classement');
  });

  it('place les exemples dans l’emplacement des actions, après les pastilles de l’étiquette', async () => {
    const serum = FIXTURE_CATALOGUE.filter((product) => product.id === 'serum-niacinamide');
    const element = await render(serum);
    const examples = element.querySelector('app-examples')!;
    const labels = examples.closest('article')!.querySelector('.app-labels')!;
    expect(examples.closest('.fd-card__actions')).not.toBeNull();
    expect(
      labels.compareDocumentPosition(examples) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('garde l’encart « Ceci n’est pas un avis médical » avec des exemples', async () => {
    const element = await render(FIXTURE_CATALOGUE);
    expect(element.querySelector('fd-alert')?.textContent).toContain(
      'Ceci n’est pas un avis médical',
    );
  });

  it('garde l’encart « Ceci n’est pas un avis médical » sans catalogue', async () => {
    const element = await render([]);
    expect(element.querySelector('fd-alert')?.textContent).toContain(
      'Ceci n’est pas un avis médical',
    );
  });

  describe('note du rétinol', () => {
    const retinol = { concern: 'wrinkles', reactions: 'never' } as const;
    const notes = (element: HTMLElement) => [...element.querySelectorAll('.app-examples__note')];

    it('s’affiche sous les exemples du soin du soir au rétinol, une seule fois', async () => {
      const element = await render(FIXTURE_CATALOGUE, retinol);
      const found = notes(element);
      expect(found).toHaveLength(1);
      expect(found[0].textContent?.trim()).toBe(RETINOL_NOTE);
      expect(found[0].textContent).toContain('grossesse');
      const card = found[0].closest('article')!;
      expect(card.querySelector('[slot="title"]')?.textContent).toMatch(/rétinol/i);
      const list = found[0].closest('app-examples')!.querySelector('ul')!;
      expect(
        list.compareDocumentPosition(found[0]) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('n’apparaît pas pour les autres soins du soir', async () => {
      for (const values of [
        { concern: 'blemishes', reactions: 'never' },
        { concern: 'blemishes', reactions: 'often' },
      ] as const) {
        TestBed.resetTestingModule();
        const element = await render(FIXTURE_CATALOGUE, values);
        expect(element.querySelector('app-examples'), values.reactions).not.toBeNull();
        expect(notes(element), values.reactions).toEqual([]);
      }
    });

    it('n’apparaît pas sans exemple de rétinol', async () => {
      const without = FIXTURE_CATALOGUE.filter((product) => product.id !== 'evening-retinol');
      expect(notes(await render(without, retinol))).toEqual([]);
      TestBed.resetTestingModule();
      expect(notes(await render([], retinol))).toEqual([]);
    });
  });
});
