import type { Product } from './products';

let counter = 0;

/** Produit valide ; les ASIN `B0TEST…` sont fictifs et ne désignent aucune fiche Amazon. */
function product(id: string, fields: Partial<Product> & Pick<Product, 'card' | 'inci'>): Product {
  counter++;
  return {
    id,
    name: `Produit d’essai ${id}`,
    brand: 'Marque d’essai',
    active: null,
    spf: null,
    asin: `B0TEST${String(counter).padStart(4, '0')}`,
    sourceUrl: `https://fabricant.example/fiches/${id}`,
    validated: '2026-10-20',
    ...fields,
  };
}

/**
 * Catalogue fictif et valide, partagé par les specs de la routine. Il n’est importé par aucun
 * code de l’appli, donc absent du bundle ; le vrai catalogue est `CATALOGUE`, dans `products.ts`.
 */
export const FIXTURE_CATALOGUE: readonly Product[] = [
  product('serum-niacinamide', {
    card: 'serum',
    active: 'niacinamide',
    inci: ['Aqua', 'Glycerin', 'Niacinamide', 'Zinc PCA'],
  }),
  // Le seul produit parfumé de chaque carte ordinaire sert aux tests d’exclusion d’une peau réactive.
  product('serum-niacinamide-parfum', {
    card: 'serum',
    active: 'niacinamide',
    inci: ['Aqua', 'Niacinamide', 'PARFUM (FRAGRANCE)'],
  }),
  product('serum-vitaminC', {
    card: 'serum',
    active: 'vitaminC',
    inci: ['Aqua', 'Ascorbyl Glucoside', 'Glycerin'],
  }),
  product('serum-hyaluronic', {
    card: 'serum',
    active: 'hyaluronic',
    inci: ['Aqua', 'Sodium Hyaluronate', 'Glycerin'],
  }),
  product('serum-soothing', {
    card: 'serum',
    active: 'soothing',
    inci: ['Aqua', 'Panthenol', 'Centella Asiatica Extract'],
  }),
  product('evening-salicylic', {
    card: 'evening',
    active: 'salicylic',
    inci: ['Aqua', 'Salicylic Acid', 'Glycerin'],
  }),
  product('evening-azelaic', {
    card: 'evening',
    active: 'azelaic',
    inci: ['Aqua', 'Azelaic Acid', 'Glycerin'],
  }),
  product('evening-retinol', {
    card: 'evening',
    active: 'retinol',
    inci: ['Squalane', 'Retinol', 'Tocopherol'],
  }),
  product('cleanser-zinc', {
    card: 'cleanser',
    inci: ['Aqua', 'Glycerin', 'Zinc PCA', 'Coco-Glucoside'],
  }),
  // Ni Glycerin ni Zinc PCA : écarté pour une peau grasse, retenu quand la carte demande Coco-Glucoside.
  product('cleanser-coco', { card: 'cleanser', inci: ['Aqua', 'Coco-Glucoside'] }),
  product('cleanser-parfum', { card: 'cleanser', inci: ['Aqua', 'Glycerin', 'Parfum'] }),
  product('moisturiser-light', {
    card: 'moisturiser',
    inci: ['Aqua', 'Glycerin', 'Sodium Hyaluronate'],
  }),
  product('moisturiser-rich', {
    card: 'moisturiser',
    inci: ['Aqua', 'Ceramide NP', 'Squalane'],
  }),
  product('moisturiser-parfum', {
    card: 'moisturiser',
    inci: ['Aqua', 'Glycerin', 'Fragrance'],
  }),
  product('sunscreen-30-mineral', {
    card: 'sunscreen',
    spf: 30,
    inci: ['Aqua', 'Zinc Oxide', 'Glycerin'],
  }),
  product('sunscreen-30-chemical', {
    card: 'sunscreen',
    spf: 30,
    inci: ['Aqua', 'Avobenzone', 'Octocrylene'],
  }),
  product('sunscreen-50-mineral', {
    card: 'sunscreen',
    spf: 50,
    inci: ['Aqua', 'Titanium Dioxide', 'Glycerin'],
  }),
  product('sunscreen-50-chemical', {
    card: 'sunscreen',
    spf: 50,
    inci: ['Aqua', 'Avobenzone', 'Octocrylene'],
  }),
];
