import {
  afterRenderEffect,
  Component,
  computed,
  DOCUMENT,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { FdEmblem, FdSwitch, FdThemeService } from 'fuda';
import { Analysis } from './analysis/analysis';
import { Home } from './home/home';
import { Question } from './question/question';
import { Result } from './result/result';
import { QuizService } from './routine/quiz.service';

@Component({
  selector: 'app-root',
  imports: [Analysis, FdEmblem, FdSwitch, Home, Question, Result],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app' },
})
export class App {
  private readonly themeService = inject(FdThemeService);
  private readonly window = inject(DOCUMENT).defaultView;
  protected readonly quiz = inject(QuizService);

  protected readonly isDark = computed(() => this.themeService.theme() === 'dark');

  constructor() {
    // Chaque écran et chaque question commencent en haut de page, comme une nouvelle page.
    afterRenderEffect(() => {
      this.quiz.screen();
      this.quiz.index();
      this.window?.scrollTo?.(0, 0);
    });
  }

  protected setDark(dark: boolean): void {
    this.themeService.set(dark ? 'dark' : 'light');
  }
}
