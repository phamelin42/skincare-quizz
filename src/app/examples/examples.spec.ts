import { TestBed } from '@angular/core/testing';
import { amazonUrl, type Product } from '../routine/products';
import { Examples } from './examples';

const base: Product = {
  id: 'essai',
  name: 'Sérum d’essai',
  brand: 'Marque d’essai',
  card: 'serum',
  active: 'niacinamide',
  spf: null,
  asin: 'B0TEST0001',
  inci: ['Aqua', 'Glycerin', 'Niacinamide'],
  sourceUrl: 'https://fabricant.example/fiches/essai',
  validated: '2026-10-20',
};

describe('Examples', () => {
  async function render(products: readonly Product[]) {
    const fixture = TestBed.createComponent(Examples);
    fixture.componentRef.setInput('products', products);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    return { element, links: [...element.querySelectorAll('a')] };
  }

  const two: Product[] = [
    base,
    { ...base, id: 'autre', name: 'Autre sérum', brand: 'Autre marque', asin: 'B0TEST0002' },
  ];

  it('propose un lien Amazon par produit, ouvert dans un nouvel onglet', async () => {
    const { links } = await render(two);
    expect(links).toHaveLength(2);
    links.forEach((link, i) => {
      expect(link.getAttribute('href')).toBe(amazonUrl(two[i].asin));
      expect(link.getAttribute('target')).toBe('_blank');
      const rel = link.getAttribute('rel')!.split(' ');
      expect(rel).toEqual(expect.arrayContaining(['sponsored', 'noopener', 'noreferrer']));
      expect(link.querySelector('.fd-sr')?.textContent?.trim()).toBe('(nouvel onglet)');
    });
  });

  it('nomme le produit et sa marque', async () => {
    const { element, links } = await render(two);
    expect(links[0].textContent).toContain('Sérum d’essai');
    expect(element.textContent).toContain('Marque d’essai');
    expect(element.textContent).toContain('Autre marque');
  });

  it('annonce les exemples sous un libellé visible', async () => {
    const { element } = await render(two);
    expect(element.querySelector('.app-label')?.textContent?.trim()).toBe('Exemples sur Amazon');
  });

  it('montre toute la composition quand elle tient en huit ingrédients, sans « … »', async () => {
    const inci = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'];
    const { element } = await render([{ ...base, inci }]);
    const text = element.textContent!.replace(/[ \t\n]+/g, ' ');
    expect(text).toContain('Composition (début de la liste) : A1, A2, A3, A4, A5, A6, A7, A8');
    expect(text).not.toContain('…');
  });

  it('coupe la composition au huitième ingrédient et le signale par « … »', async () => {
    const inci = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10'];
    const { element } = await render([{ ...base, inci }]);
    const text = element.textContent!.replace(/[ \t\n]+/g, ' ');
    expect(text).toContain('A1, A2, A3, A4, A5, A6, A7, A8 …');
    expect(text).not.toContain('A9');
  });

  it('n’affiche ni image ni prix', async () => {
    const { element } = await render(two);
    expect(element.querySelector('img, svg, picture')).toBeNull();
    expect(element.textContent).not.toMatch(/€|EUR/);
  });
});
