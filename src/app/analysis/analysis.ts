import { Component, ViewEncapsulation } from '@angular/core';
import { FdSpinner } from 'fuda';

@Component({
  selector: 'app-analysis',
  imports: [FdSpinner],
  templateUrl: './analysis.html',
  styleUrl: './analysis.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-analysis' },
})
export class Analysis {}
