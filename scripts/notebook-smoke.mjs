import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: [
    '--enable-webgl',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});
const base = process.env.NOTEBOOK_BASE_URL ?? 'http://127.0.0.1:5174';
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + '/?scale=legion');
await page.waitForFunction(
  () =>
    Number(
      document.querySelector('.viewport')?.getAttribute('data-component-types'),
    ) > 0,
  {},
  { timeout: 60000 },
);
await page.evaluate(
  () =>
    new Promise((resolve) => {
      let frames = 0;
      const tick = () =>
        ++frames > 25 ? resolve(null) : requestAnimationFrame(tick);
      requestAnimationFrame(tick);
    }),
);
await page.screenshot({
  path: 'docs/screenshots/legion-assembled.png',
  timeout: 60000,
});
await page
  .getByRole('button', { name: 'Inventory', exact: true })
  .evaluate((el) => el.click());
await page.waitForFunction(
  () =>
    document.querySelector('.viewport')?.getAttribute('data-explode') === '100',
  {},
  { timeout: 60000 },
);
await page.screenshot({
  path: 'docs/screenshots/legion-inventory.png',
  timeout: 60000,
});
await page
  .locator('.system-picker button')
  .filter({ hasText: 'MacBook' })
  .evaluate((el) => el.click());
await page.waitForFunction(
  () =>
    document.querySelector('.viewport')?.getAttribute('data-level') ===
    'macbook',
  {},
  { timeout: 60000 },
);
await page.screenshot({
  path: 'docs/screenshots/macbook-assembled.png',
  timeout: 60000,
});
assert.deepEqual(errors, []);
await page
  .getByRole('button', { name: 'Reset camera and assembly' })
  .evaluate((el) => el.click());
assert.equal(new URL(page.url()).searchParams.get('scale'), 'macbook');
await page
  .getByRole('button', { name: 'Compare components' })
  .evaluate((el) => el.click());
await page
  .getByRole('button', { name: 'Laptops', exact: true })
  .evaluate((el) => el.click());
await page.waitForFunction(
  () =>
    document.querySelector('[aria-label="Left laptop"]')?.value === 'legion',
);
assert.equal(
  await page.getByLabel('Right laptop', { exact: true }).inputValue(),
  'macbook',
);
await page
  .getByRole('button', { name: 'Swap comparison sides' })
  .evaluate((el) => el.click());
assert.equal(
  await page.getByLabel('Left laptop', { exact: true }).inputValue(),
  'macbook',
);
await page
  .getByRole('button', { name: 'Back to explorer' })
  .evaluate((el) => el.click());
await page.goto(base + '/?scale=maccell');
await page.waitForFunction(
  () =>
    document.querySelector('.viewport')?.getAttribute('data-level') ===
    'maccell',
  {},
  { timeout: 60000 },
);
await page.setViewportSize({ width: 390, height: 844 });
await page
  .getByRole('button', { name: 'Toggle systems' })
  .evaluate((el) => el.click());
await page
  .locator('.system-picker button')
  .filter({ hasText: 'Laptops' })
  .evaluate((el) => el.click());
await page.waitForFunction(
  () =>
    document.querySelector('.viewport')?.getAttribute('data-level') ===
    'legion',
  {},
  { timeout: 60000 },
);
await page.screenshot({
  path: 'docs/screenshots/legion-mobile.png',
  timeout: 60000,
});
assert.deepEqual(errors, []);
console.log(
  JSON.stringify({
    errors,
    level: await page.locator('.viewport').getAttribute('data-level'),
  }),
);
await browser.close();
