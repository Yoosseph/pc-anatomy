import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const base = process.env.NOTEBOOK_BASE_URL ?? 'http://127.0.0.1:5173';
console.log('Checking laptop interactions at', base);
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on('pageerror', (error) => {
    errors.push(error.message);
    console.log('Page error:', error.message);
  });
  await page.addInitScript(() =>
    sessionStorage.setItem('pc-anatomy-performance-tip-v1', '1'),
  );
  const ready = async (level, explode = 0) => {
    await page.waitForFunction(
      ({ level, explode }) => {
        const host = document.querySelector('.viewport');
        return (
          host?.dataset.level === level &&
          Number(host.dataset.explode) === explode &&
          host.dataset.cameraSettled === 'true' &&
          host.dataset.transitioning !== 'true' &&
          Number(host.dataset.triangles) > 0
        );
      },
      { level, explode },
      { timeout: 60000 },
    );
    assert.deepEqual(errors, [], level);
  };
  const phase = async (name, level, amount) => {
    await page
      .getByRole('button', { name, exact: true })
      .evaluate((button) => button.click());
    await ready(level, amount);
  };
  const capture = (name) =>
    page.screenshot({ path: `docs/screenshots/${name}.png`, timeout: 60000 });
  const openFromTray = async (label, destination) => {
    console.log('Opening', destination, 'from its tray item');
    await page
      .getByRole('list', { name: 'Parts on the tray' })
      .getByRole('button', { name: label, exact: true })
      .evaluate((button) => button.click());
    await page
      .getByRole('button', { name: new RegExp('^Take apart ') })
      .evaluate((button) => button.click());
    await ready(destination);
  };
  await page.goto(base + '/?scale=legion');
  await ready('legion');
  await capture('legion-assembled');
  await phase('Dissection', 'legion', 50);
  await capture('legion-exploded');
  await phase('Inventory', 'legion', 100);
  await capture('legion-inventory');
  await openFromTray('Legion system board', 'legionboard');
  await phase('Inventory', 'legionboard', 100);
  await openFromTray('DDR4 SO-DIMM', 'legionmemory');
  await phase('Inventory', 'legionmemory', 100);
  await openFromTray('DDR4 FBGA packages', 'legionpackage');
  await phase('Dissection', 'legionpackage', 50);
  await capture('legion-package-exploded');
  console.log('Switching to Mac');
  await page
    .locator('.system-picker button')
    .filter({ hasText: 'MacBook' })
    .evaluate((button) => button.click());
  await ready('macbook');
  await capture('macbook-assembled');
  await phase('Dissection', 'macbook', 50);
  await capture('macbook-exploded');
  await page
    .getByRole('button', { name: 'Reset camera and assembly' })
    .evaluate((button) => button.click());
  await ready('macbook');
  assert.equal(new URL(page.url()).searchParams.get('scale'), 'macbook');
  console.log('Comparing both laptops');
  await page
    .getByRole('button', { name: 'Compare components' })
    .evaluate((button) => button.click());
  await page
    .getByRole('button', { name: 'Laptops', exact: true })
    .evaluate((button) => button.click());
  await page.waitForFunction(
    () =>
      document.querySelector('.comparison-viewport')?.dataset.pair ===
      'legion:macbook',
  );
  await page
    .getByRole('button', { name: 'Swap comparison sides' })
    .evaluate((button) => button.click());
  await page.waitForFunction(
    () =>
      document.querySelector('.comparison-viewport')?.dataset.pair ===
      'macbook:legion',
  );
  await page
    .getByRole('button', { name: 'Back to explorer' })
    .evaluate((button) => button.click());
  console.log('Checking the existing desktop explorer');
  await page
    .locator('.system-picker button')
    .filter({ hasText: 'Desktop PC' })
    .evaluate((button) => button.click());
  await ready('pc');
  console.log('Checking mobile navigation and deep links');
  await page.goto(base + '/?scale=maccell');
  console.log(
    'Cell page loaded',
    await page.locator('.viewport').getAttribute('data-level'),
  );
  await ready('maccell');
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole('button', { name: 'Toggle systems' })
    .evaluate((button) => button.click());
  await page
    .locator('.system-picker button')
    .filter({ hasText: 'Laptops' })
    .evaluate((button) => button.click());
  await ready('legion');
  await capture('legion-mobile');
  assert.deepEqual(errors, []);
  console.log(
    'Laptop interaction checks passed: tray dives, reset, comparison, mobile, links; no page errors.',
  );
} finally {
  await browser.close();
}
