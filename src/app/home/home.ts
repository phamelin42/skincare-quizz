import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FdBadge, FdButton, FdCard } from 'fuda';
import { QuizService } from '../routine/quiz.service';

@Component({
  selector: 'app-home',
  imports: [FdBadge, FdButton, FdCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-home' },
})
export class Home {
  protected readonly quiz = inject(QuizService);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  constructor() {
    afterNextRender(() => this.heading().nativeElement.focus({ preventScroll: true }));
  }
}
