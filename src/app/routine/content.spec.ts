import { INGREDIENTS, RETINOL_NOTE } from './content';
import { PROMISE } from './products';

describe('RETINOL_NOTE', () => {
  it('déconseille le rétinol pendant la grossesse et l’allaitement, sans nuance', () => {
    expect(
      RETINOL_NOTE.startsWith('Le rétinol est déconseillé pendant la grossesse et l’allaitement.'),
    ).toBe(true);
    expect(RETINOL_NOTE).not.toMatch(/en cas de doute/i);
  });

  it('renvoie vers un médecin ou un pharmacien dans une phrase à part', () => {
    expect(RETINOL_NOTE).toContain('. Demandez conseil à un médecin ou à un pharmacien.');
  });

  it('explique l’application le soir, progressive, avec un écran solaire le matin', () => {
    // Le sujet est nommé : « Il » se lirait comme le médecin ou le pharmacien de la phrase d’avant.
    expect(RETINOL_NOTE).toContain(
      '. Le rétinol peut irriter et rendre la peau plus sensible au soleil',
    );
    expect(RETINOL_NOTE).not.toMatch(/\bIl\b/);
    expect(RETINOL_NOTE).toMatch(/soleil/);
    expect(RETINOL_NOTE).toMatch(/le soir/);
    expect(RETINOL_NOTE).toMatch(/progressive/);
    expect(RETINOL_NOTE).toMatch(/écran solaire le matin/);
  });

  it('n’ajoute ni chiffre ni promesse de résultat', () => {
    expect(RETINOL_NOTE).not.toMatch(/\d/);
    expect(RETINOL_NOTE).not.toMatch(PROMISE);
  });

  it('suit la typographie française : apostrophe courbe, aucune espace avant la ponctuation haute', () => {
    expect(RETINOL_NOTE).not.toContain("'");
    expect(RETINOL_NOTE).not.toMatch(/ [:;?!]/);
    expect(RETINOL_NOTE).toContain('’');
  });
});

describe('INGREDIENTS', () => {
  it('donne la niacinamide à 2 à 5\u00a0%', () => {
    expect(INGREDIENTS.niacinamide.dose).toBe('2 à 5\u00a0%');
  });

  it('précise que la concentration de la vitamine C vaut pour l’acide ascorbique', () => {
    // Les dérivés listés en INCI (glucoside, phosphate) s’emploient à d’autres concentrations.
    expect(INGREDIENTS.vitaminC.dose).toBe('10 à 15\u00a0% d’acide ascorbique');
    expect(INGREDIENTS.vitaminC.inci).toContain('Ascorbic Acid');
  });
});
