import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { QUESTIONS } from './routine/questions';
import { ANSWER_DELAY } from './routine/quiz.service';

describe('App', () => {
  // jsdom n'a pas de défilement.
  beforeEach(() => vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined));

  async function render() {
    TestBed.configureTestingModule({ imports: [App] });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const button = (name: string) =>
      [...element.querySelectorAll('button')].find((b) => b.textContent?.trim() === name);
    return { fixture, element, button };
  }

  it('présente le questionnaire et le thème Nuit', async () => {
    const { element } = await render();
    expect(element.querySelector('h1')!.textContent?.trim()).toBe(
      'Votre routine de soin, en 10 questions',
    );
    expect(element.querySelector('fd-switch')).not.toBeNull();
  });

  it('affiche la première question après « Commencer »', async () => {
    const { fixture, element, button } = await render();
    button('Commencer')!.click();
    await fixture.whenStable();
    expect(element.querySelector('h1')!.textContent?.trim()).toBe(QUESTIONS[0].text);
    expect(element.querySelectorAll('.app-answers button')).toHaveLength(
      QUESTIONS[0].options.length,
    );
    expect(element.textContent).not.toContain('Précédent');
  });

  it('choisit une réponse avec son chiffre au clavier', async () => {
    const { fixture, element, button } = await render();
    button('Commencer')!.click();
    await fixture.whenStable();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: '2' }));
    await fixture.whenStable();
    const pressed = element.querySelectorAll('.app-answers [aria-pressed="true"]');
    expect(pressed).toHaveLength(1);
    expect(pressed[0].textContent).toContain(QUESTIONS[0].options[1].label);

    await new Promise((resolve) => setTimeout(resolve, ANSWER_DELAY));
    await fixture.whenStable();
    expect(element.querySelector('h1')!.textContent?.trim()).toBe(QUESTIONS[1].text);
    expect(button('Précédent')).toBeDefined();
  });
});
