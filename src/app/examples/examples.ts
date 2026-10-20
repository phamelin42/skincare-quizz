import { Component, computed, input, ViewEncapsulation } from '@angular/core';
import { amazonUrl, type Product } from '../routine/products';

/** Assez pour reconnaître l’actif, sans recopier toute la liste de la fiche du fabricant. */
const INCI_SHOWN = 8;

@Component({
  selector: 'app-examples',
  templateUrl: './examples.html',
  styleUrl: './examples.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-examples' },
})
export class Examples {
  readonly products = input.required<readonly Product[]>();

  protected readonly items = computed(() =>
    this.products().map((product) => ({
      id: product.id,
      name: product.name,
      brand: product.brand,
      href: amazonUrl(product.asin),
      // Espace insécable : le « … » ne reste pas seul en début de ligne.
      inci:
        product.inci.slice(0, INCI_SHOWN).join(', ') +
        (product.inci.length > INCI_SHOWN ? '\u00a0…' : ''),
    })),
  );
}
