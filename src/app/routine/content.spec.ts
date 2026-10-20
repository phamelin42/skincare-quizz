import { RETINOL_NOTE } from './content';
import { PROMISE } from './products';

describe('RETINOL_NOTE', () => {
  it('déconseille le rétinol pendant la grossesse et l’allaitement et renvoie vers un professionnel', () => {
    expect(RETINOL_NOTE).toContain('grossesse');
    expect(RETINOL_NOTE).toContain('allaitement');
    expect(RETINOL_NOTE).toMatch(/déconseillé/);
    expect(RETINOL_NOTE).toContain('médecin');
    expect(RETINOL_NOTE).toContain('pharmacien');
  });

  it('explique l’application le soir, progressive, avec un écran solaire le matin', () => {
    expect(RETINOL_NOTE).toMatch(/irriter/);
    expect(RETINOL_NOTE).toMatch(/soleil/);
    expect(RETINOL_NOTE).toMatch(/le soir/);
    expect(RETINOL_NOTE).toMatch(/progressive/);
    expect(RETINOL_NOTE).toMatch(/écran solaire le matin/);
  });

  it('n’ajoute ni chiffre ni promesse de résultat', () => {
    expect(RETINOL_NOTE).not.toMatch(/\d/);
    expect(RETINOL_NOTE).not.toMatch(PROMISE);
  });

  it('suit la typographie française : apostrophe courbe, espace insécable avant « : »', () => {
    expect(RETINOL_NOTE).not.toContain("'");
    expect(RETINOL_NOTE).not.toMatch(/ [:;?!]/);
    expect(RETINOL_NOTE).toMatch(/\u00a0:/);
    expect(RETINOL_NOTE).toContain('’');
  });
});
