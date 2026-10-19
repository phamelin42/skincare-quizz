import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('la page affiche son titre', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Skincare Quizz' })).toBeVisible();
});

test("les icônes d'onglet répondent", async ({ request }) => {
  for (const file of ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png']) {
    const response = await request.get(file);
    expect(response.ok(), file).toBe(true);
  }
});

for (const theme of ['light', 'dark'] as const) {
  test(`axe (WCAG 2.2 AA), thème ${theme}`, async ({ page }) => {
    if (theme === 'dark') {
      await page.addInitScript(() => localStorage.setItem('fuda-theme', 'dark'));
    }
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(violations).toEqual([]);
  });
}
