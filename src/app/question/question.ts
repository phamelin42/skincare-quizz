import {
  afterRenderEffect,
  Component,
  ElementRef,
  inject,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FdButton, FdIcon, FdProgress } from 'fuda';
import { QuizService } from '../routine/quiz.service';

@Component({
  selector: 'app-question',
  imports: [FdButton, FdIcon, FdProgress],
  templateUrl: './question.html',
  styleUrl: './question.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-quiz', '(document:keydown)': 'onKeydown($event)' },
})
export class Question {
  protected readonly quiz = inject(QuizService);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  constructor() {
    // Chaque nouvelle question est annoncée : le focus revient sur son intitulé.
    afterRenderEffect(() => {
      this.quiz.index();
      this.heading().nativeElement.focus({ preventScroll: true });
    });
  }

  /** Les chiffres 1 à 9 choisissent la réponse correspondante. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const digit = Number(event.key);
    if (Number.isInteger(digit) && digit >= 1 && digit <= 9) {
      this.quiz.choose(digit - 1);
    }
  }
}
