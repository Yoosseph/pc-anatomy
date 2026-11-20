import { expect, test } from '@playwright/test';

test('a French browser opens in French', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'fr-FR' });
  const page = await context.newPage();
  await page.goto('/?scale=motherboard');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'La carte mère.',
  );
  await expect(page.getByRole('button', { name: /^Avis/ })).toBeVisible();
  await context.close();
});

test('the language menu switches language and keeps the place', async ({
  page,
}) => {
  await page.goto('/?scale=motherboard');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'The motherboard.',
  );
  await Promise.all([
    page.waitForEvent('load'),
    page.getByLabel('Language').selectOption('fr'),
  ]);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page).toHaveURL(/scale=motherboard/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'La carte mère.',
  );
  // The choice outlives the reload and beats the browser's language.
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await Promise.all([
    page.waitForEvent('load'),
    page.getByLabel('Langue').selectOption('en'),
  ]);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'The motherboard.',
  );
});
