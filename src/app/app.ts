import { Component, computed, inject, ViewEncapsulation } from '@angular/core';
import { FdSwitch, FdThemeService } from 'fuda';

@Component({
  selector: 'app-root',
  imports: [FdSwitch],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app' },
})
export class App {
  private readonly themeService = inject(FdThemeService);

  protected readonly title = 'Skincare Quizz';
  protected readonly tagline = "Connaissez-vous bien les soins de la peau ?";
  protected readonly isDark = computed(() => this.themeService.theme() === 'dark');

  protected setDark(dark: boolean): void {
    this.themeService.set(dark ? 'dark' : 'light');
  }
}
