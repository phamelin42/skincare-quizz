import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  it('affiche le titre du site', async () => {
    TestBed.configureTestingModule({ imports: [App] });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')!.textContent).toBe('Skincare Quizz');
  });

  it('bascule le thème Nuit', async () => {
    TestBed.configureTestingModule({ imports: [App] });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('fd-switch')).not.toBeNull();
  });
});
