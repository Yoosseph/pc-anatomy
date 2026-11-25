import { expect, test } from '@playwright/test';

test('chip labels the next theme and keeps original hardware colors', async ({ page }) => {
  await page.goto('/');
  const enable = page.getByRole('button', { name: 'Switch to light' });
  const disable = page.getByRole('button', { name: 'Switch to dark' });
  const header = page.locator('.topbar');
  const root = page.locator('html');
  await expect(enable.getByText('Switch to light')).toBeVisible();
  await expect(header).toHaveCSS('background-color', 'rgb(13, 14, 14)');
  await enable.click();
  await expect(disable.getByText('Switch to dark')).toBeVisible();
  await expect(header).toHaveCSS('background-color', 'rgb(212, 215, 217)');
  await expect(page.locator('.explorer')).toHaveCSS('background-color', 'rgb(225, 227, 229)');
  await expect(page.locator('body')).toHaveCSS('background-image', /rgb\(255, 255, 255\) 80%/);
  await expect(root).toHaveCSS('filter', 'none');
  await page.reload();
  await expect(disable).toBeVisible();
  await page.goto('/guide/');
  await expect(root).toHaveCSS('color-scheme', 'light');
  await expect(root).toHaveCSS('filter', 'none');
  await page.goto('/');
  await disable.press('Enter');
  await expect(enable).toBeVisible();
  await expect(header).toHaveCSS('background-color', 'rgb(13, 14, 14)');
});
