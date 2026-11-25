import { expect, test } from '@playwright/test';

test('chip labels the next theme and keeps original hardware colors', async ({ page }) => {
  await page.goto('/');
  const enable = page.getByRole('button', { name: 'Switch to light mode' });
  const disable = page.getByRole('button', { name: 'Switch to dark mode' });
  const header = page.locator('.topbar');
  const root = page.locator('html');
  await expect(enable.getByText('Light mode')).toBeVisible();
  await expect(header).toHaveCSS('background-color', 'rgb(13, 14, 14)');
  await enable.click();
  await expect(disable.getByText('Dark mode')).toBeVisible();
  await expect(header).toHaveCSS('background-color', 'rgb(255, 255, 255)');
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
