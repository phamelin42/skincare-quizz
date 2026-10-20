import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FdAlert, FdBadge, FdButton, FdCard } from 'fuda';
import { CONCERN_LABELS, INGREDIENTS, SKIN_TYPES, START_ADVICE } from '../routine/content';
import { AFFILIATE_NOTICE, EXAMPLES_NOTE } from '../routine/products';
import { QuizService } from '../routine/quiz.service';
import { Examples } from '../examples/examples';

const MINUTES = { '2': '2 minutes', '5': '5 minutes', '10': '10 minutes' } as const;

@Component({
  selector: 'app-result',
  imports: [Examples, FdAlert, FdBadge, FdButton, FdCard],
  templateUrl: './result.html',
  styleUrl: './result.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-result' },
})
export class Result {
  protected readonly quiz = inject(QuizService);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');

  protected readonly view = computed(() => {
    const result = this.quiz.result();
    if (!result) return null;
    const { profile } = result;
    return {
      ...result,
      skin: SKIN_TYPES[profile.type],
      concerns: profile.concerns.map((concern) => CONCERN_LABELS[concern]),
      ingredients: result.ingredients.map((key) => ({ key, ...INGREDIENTS[key] })),
      minutes: MINUTES[profile.time],
      advice: START_ADVICE[profile.start],
      // La mention suit les liens : elle n’apparaît que si une carte en montre au moins un.
      affiliate: result.products.some((card) => card.examples.length > 0),
      notice: AFFILIATE_NOTICE,
      note: EXAMPLES_NOTE,
    };
  });

  constructor() {
    afterNextRender(() => this.heading()?.nativeElement.focus({ preventScroll: true }));
  }
}
