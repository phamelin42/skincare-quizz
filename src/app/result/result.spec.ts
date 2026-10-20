import { TestBed } from '@angular/core/testing';
import { Result } from './result';
import { AFFILIATE_NOTICE, EXAMPLES_NOTE, PRODUCT_CATALOGUE } from '../routine/products';
import { FIXTURE_CATALOGUE } from '../routine/products.fixture';
import { QUESTIONS } from '../routine/questions';
import { ANALYSIS_DELAY, ANSWER_DELAY, QuizService } from '../routine/quiz.service';

describe('Result', () => {
  afterEach(() => vi.useRealTimers());

  /** Première option partout : peau grasse, sérum à la niacinamide (voir quiz.service.spec.ts). */
  async function render(catalogue?: readonly (typeof FIXTURE_CATALOGUE)[number][]) {
    if (catalogue) {
      TestBed.configureTestingModule({
        providers: [{ provide: PRODUCT_CATALOGUE, useValue: catalogue }],
      });
    }
    const quiz = TestBed.inject(QuizService);
    // Les minuteries du parcours sont simulées ; le rendu, lui, attend de vraies minuteries.
    vi.useFakeTimers();
    quiz.start();
    QUESTIONS.forEach(() => {
      quiz.choose(0);
      vi.advanceTimersByTime(ANSWER_DELAY);
    });
    vi.advanceTimersByTime(ANALYSIS_DELAY);
    vi.useRealTimers();
    const fixture = TestBed.createComponent(Result);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const count = (text: string, part: string) => text.split(part).length - 1;

  it('n’affiche aucun exemple ni mention d’affiliation quand le catalogue est vide', async () => {
    const element = await render();
    expect(element.querySelector('app-examples')).toBeNull();
    expect(element.textContent).not.toContain('Partenaire Amazon');
    expect(element.textContent).not.toContain('Exemples sur Amazon');
  });

  it('affiche les exemples sous la carte concernée, avec la mention une seule fois', async () => {
    const serum = FIXTURE_CATALOGUE.filter((product) => product.id === 'serum-niacinamide');
    const element = await render(serum);

    const blocks = [...element.querySelectorAll('app-examples')];
    expect(blocks).toHaveLength(1);
    const card = blocks[0].closest('article')!;
    expect(card.querySelector('[slot="title"]')?.textContent).toMatch(/sérum/i);
    expect(blocks[0].querySelector('a')?.textContent).toContain('serum-niacinamide');

    const text = element.textContent!.replace(/[ \t\n]+/g, ' ');
    expect(count(text, AFFILIATE_NOTICE)).toBe(1);
    expect(count(text, EXAMPLES_NOTE)).toBe(1);
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
    const element = await render();
    expect(element.querySelector('fd-alert')?.textContent).toContain(
      'Ceci n’est pas un avis médical',
    );
  });
});
