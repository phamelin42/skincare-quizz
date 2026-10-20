import {
  afterNextRender,
  Component,
  ElementRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FdSpinner } from 'fuda';

@Component({
  selector: 'app-analysis',
  imports: [FdSpinner],
  templateUrl: './analysis.html',
  styleUrl: './analysis.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-analysis' },
})
export class Analysis {
  private readonly message = viewChild.required<ElementRef<HTMLElement>>('message');

  constructor() {
    // Le bouton de la dernière réponse vient de disparaître : le focus ne retombe pas sur <body>.
    afterNextRender(() => this.message().nativeElement.focus({ preventScroll: true }));
  }
}
