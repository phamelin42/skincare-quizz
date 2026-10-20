import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

const TITLE = 'Votre routine de soin, en 10 questions';

/** Répond à toutes les questions au clavier, par le chiffre de l'option. */
async function answerAll(page: Page, keys = ['1', '2', '3', '1', '3', '3', '2', '1', '2', '2']) {
  for (const [i, key] of keys.entries()) {
    await expect(page.getByText(`Question ${i + 1} sur 10`, { exact: true })).toBeVisible();
    await page.keyboard.press(key);
  }
}

/** axe au repos : une couleur lue pendant une transition serait interpolée. */
async function expectNoViolations(page: Page) {
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== 'running'),
  );
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(violations).toEqual([]);
  // Hors WCAG mais exigé par le projet : un seul h1, des titres sans saut et jamais vides.
  const headings = await new AxeBuilder({ page })
    .withRules(['page-has-heading-one', 'heading-order', 'empty-heading'])
    .analyze();
  expect(headings.violations).toEqual([]);
}

test('la page présente le questionnaire', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Skincare Quizz/);
  await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeFocused();
});

test("les icônes d'onglet répondent", async ({ request }) => {
  for (const file of ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png']) {
    const response = await request.get(file);
    expect(response.ok(), file).toBe(true);
  }
});

test('le parcours se fait entièrement au clavier', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Commencer' }).focus();
  await page.keyboard.press('Enter');

  const first = page.getByRole('heading', { level: 1 });
  await expect(first).toHaveText(/Quelques heures après/);
  await expect(first).toBeFocused();
  await expect(page.getByRole('button', { name: 'Précédent' })).toHaveCount(0);

  // Une réponse au chiffre coche l'option, puis l'intitulé suivant reçoit le focus.
  await page.keyboard.press('3');
  await expect(page.getByRole('heading', { level: 1, name: /En fin de journée/ })).toBeFocused();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '10');

  // Retour : la réponse donnée reste cochée.
  await page.getByRole('button', { name: 'Précédent' }).click();
  await expect(page.getByRole('button', { name: /Brille partout/, pressed: true })).toBeVisible();

  await answerAll(page);
  await expect(page.getByRole('status')).toHaveText('Analyse de vos réponses…');
  await expect(page.getByRole('status')).toBeFocused();
  const result = page.getByRole('heading', { level: 1, name: /Vos réponses évoquent une peau/ });
  await expect(result).toBeFocused();
  for (const name of [
    'Les ingrédients à privilégier',
    'Votre routine',
    'Les produits qui correspondent',
  ]) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }
  await expect(page.getByText('Ceci n’est pas un avis médical')).toBeVisible();

  await page.getByRole('button', { name: 'Modifier mes réponses' }).click();
  await expect(page.getByText('Question 1 sur 10', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { pressed: true })).toHaveCount(1);

  await answerAll(page);
  await page.getByRole('button', { name: 'Recommencer' }).click();
  await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeFocused();
  await page.getByRole('button', { name: 'Commencer' }).click();
  await expect(page.getByRole('button', { pressed: true })).toHaveCount(0);
});

test('rien ne déborde en largeur à 320 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Commencer' }).click();
  await expect(page.getByText('Question 1 sur 10', { exact: true })).toBeVisible();

  // Une réponse donnée en bas de page ramène la question suivante en haut.
  await page.getByRole('button', { name: /Reste confortable/ }).click();
  await expect(page.getByText('Question 2 sur 10', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  const back = await page.getByRole('button', { name: 'Précédent' }).boundingBox();
  expect(back!.height).toBeGreaterThanOrEqual(44);
  await page.getByRole('button', { name: 'Précédent' }).click();

  await answerAll(page);
  await expect(page.getByRole('button', { name: 'Recommencer' })).toBeVisible();
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(320);
});

for (const theme of ['light', 'dark'] as const) {
  test(`axe (WCAG 2.2 AA) sur chaque écran, thème ${theme}`, async ({ page }) => {
    if (theme === 'dark') {
      await page.addInitScript(() => localStorage.setItem('fuda-theme', 'dark'));
    }
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeVisible();
    await expectNoViolations(page);

    await page.getByRole('button', { name: 'Commencer' }).click();
    await expect(page.getByText('Question 1 sur 10', { exact: true })).toBeVisible();
    await page.keyboard.press('2');
    await expect(page.getByRole('button', { name: 'Précédent' })).toBeVisible();
    await page.getByRole('button', { name: 'Précédent' }).click();
    await expect(page.getByRole('button', { pressed: true })).toBeVisible();
    await expectNoViolations(page);

    await answerAll(page);
    await expect(page.getByRole('button', { name: 'Recommencer' })).toBeVisible();
    await expectNoViolations(page);
  });
}
