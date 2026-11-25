import { expect, test } from '@playwright/test';

test('the brand toggles the whole page and remembers the theme', async ({ page }) => {
  await page.goto('/');
  const chip = page.getByRole('button', { name: 'Light theme', exact: true });
  const root = page.locator('html');
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
  await chip.click();
  await expect(root).toHaveCSS('filter', 'invert(1)');
  await page.reload();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/guide/');
  await expect(root).toHaveCSS('filter', 'invert(1)');
  await page.goto('/');
  await chip.press('Enter');
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
  await expect(root).toHaveCSS('filter', 'none');
});
