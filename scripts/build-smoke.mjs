import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

/**
 * Build mode in a real browser: open the panel, swap the card and the supply,
 * read the checks, take the installed card apart, and come back with the
 * build kept. Screenshots land in `outputs/build`.
 */
const base = process.env.BUILD_BASE_URL ?? 'http://127.0.0.1:5173';
const output = process.env.BUILD_SCREENSHOTS ?? 'outputs/build';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args:
    process.env.BUILD_SOFTWARE === '1'
      ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
      : [],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    sessionStorage.setItem('pc-anatomy-performance-tip-v1', '1');
    localStorage.setItem('pc-anatomy-first-visit-hint-v1', '1');
  });
  const click = (name) => {
    console.log('Click:', name);
    return page
      .getByRole('button', { name, exact: true })
      .first()
      .evaluate((button) => button.click());
  };
  /** A part in the build panel, by the start of its name. */
  const pick = (name) => {
    console.log('Pick:', name);
    return page
      .locator('.build-option')
      .filter({ hasText: name })
      .evaluate((button) => button.click());
  };
  const triangles = () =>
    page.evaluate(() =>
      Number(document.querySelector('.viewport')?.dataset.triangles),
    );
  const ready = async (level = 'pc') => {
    await page.waitForFunction(
      (level) => {
        const d = document.querySelector('.viewport')?.dataset;
        return (
          d?.level === level &&
          d.cameraSettled === 'true' &&
          Number(d.triangles) > 0
        );
      },
      level,
      { timeout: 60000 },
    );
    assert.deepEqual(errors, []);
  };
  /** Wait for the tower to be rebuilt with a different part in it. */
  const rebuilt = async (before) => {
    await page.waitForFunction(
      (before) =>
        Number(document.querySelector('.viewport')?.dataset.triangles) !==
        before,
      before,
      { timeout: 60000 },
    );
    await ready();
  };
  const summary = () => page.locator('.build-summary').innerText();
  const capture = (name) =>
    page.screenshot({ path: `${output}/${name}.png`, timeout: 60000 });

  await page.goto(base);
  await ready();
  await page
    .getByRole('button', { name: /Build your own PC/ })
    .evaluate((button) => button.click());
  await page.locator('.build-section').waitFor();
  assert.match(await summary(), /1 thing to check/);
  await capture('build-original');

  let before = await triangles();
  await pick(/^Radeon RX 9070 XT/);
  await rebuilt(before);
  assert.match(await summary(), /Everything works together/);
  await capture('build-radeon');

  before = await triangles();
  await pick(/^ASUS TUF Gaming 750W Bronze/);
  await rebuilt(before);
  assert.match(await summary(), /problem/);
  await capture('build-radeon-bronze');

  before = await triangles();
  await pick(/^Intel Arc B580/);
  await rebuilt(before);
  assert.match(await summary(), /Everything works together/);

  // A processor that cannot seat is reported, and the tower does not change.
  before = await triangles();
  await pick(/^Intel Core Ultra 9 285K/);
  assert.match(await summary(), /problem/);
  assert.equal(await triangles(), before);
  await pick(/^AMD Ryzen 9 9950X/);
  await capture('build-arc-bronze');

  // The installed card describes itself, and opens into its own scale.
  await page.evaluate(() =>
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })),
  );
  await click('Show power flow');
  await click('Inspect Graphics card: 8-pin PCIe');
  await page
    .getByRole('heading', { name: 'Intel Arc B580 Limited Edition', exact: true })
    .waitFor();
  await capture('build-arc-detail');
  await page
    .getByRole('button', { name: /^Take apart / })
    .evaluate((button) => button.click());
  await ready('arcb580');
  await page.goBack();
  await ready();
  // The build survives the round trip, and Reset.
  await click('Reset camera and assembly');
  await ready();
  assert.match(await summary(), /Everything works together/);
  await click('Back to the original build');
  await ready();
  assert.match(await summary(), /1 thing to check/);

  for (const [width, height] of [
    [390, 844],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await ready();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await click('Toggle systems');
  await capture('build-mobile');
  assert.deepEqual(errors, []);
  console.log('Build smoke passed.');
} finally {
  await browser.close();
}
