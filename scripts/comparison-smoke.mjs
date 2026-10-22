import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.COMPARISON_BASE_URL ?? 'http://127.0.0.1:5173';
const output = process.env.COMPARISON_SCREENSHOTS ?? 'outputs/comparison';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args:
    process.env.COMPARISON_SOFTWARE === '1'
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
  page.on('console', (message) => {
    // Vercel serves its analytics script only on deployments, not in preview.
    if (
      message.type() === 'error' &&
      !message.location().url.includes('/_vercel/insights/')
    )
      errors.push(message.text());
  });
  await page.addInitScript(() => {
    sessionStorage.setItem('pc-anatomy-performance-tip-v1', '1');
    localStorage.setItem('pc-anatomy-first-visit-hint-v1', '1');
  });
  // This app's moving canvas can prevent Playwright's click stability check.
  // Activate semantic buttons directly; keyboard paths are exercised below.
  const click = (name, scope = page) =>
    scope
      .getByRole('button', { name, exact: true })
      .evaluate((button) => button.click());
  const ready = async (pair, explode = 0) => {
    await page.waitForFunction(
      ({ pair, explode }) => {
        const d = document.querySelector('.comparison-viewport')?.dataset;
        return (
          (!pair || d?.pair === pair) &&
          Number(d?.explode) === explode &&
          d?.cameraSettled === 'true' &&
          Number(d?.triangles) > 0
        );
      },
      { pair, explode },
      { timeout: 60000 },
    );
    assert.deepEqual(errors, []);
  };
  const currentPair = () =>
    page.locator('.comparison-viewport').getAttribute('data-pair');
  const capture = (name) =>
    page.screenshot({ path: `${output}/${name}.png`, timeout: 60000 });
  const openPicker = async (side) => {
    await click(`Choose part ${side}`);
    const dialog = page.getByRole('dialog', { name: `Choose part ${side}` });
    await dialog.waitFor();
    return dialog;
  };
  const clearFilters = async (dialog) => {
    await dialog.getByRole('textbox', { name: 'Search parts' }).fill('');
    await dialog.getByLabel('System', { exact: true }).selectOption('all');
    await click(
      'All parts',
      dialog.getByRole('navigation', { name: 'Part categories' }),
    );
  };
  const choose = async (side, level) => {
    const before = (await currentPair()).split(':');
    const dialog = await openPicker(side);
    await clearFilters(dialog);
    await dialog
      .locator(`button[data-level="${level}"]`)
      .evaluate((button) => button.click());
    await dialog.waitFor({ state: 'hidden' });
    before[side === 'A' ? 0 : 1] = level;
    await ready(before.join(':'));
  };
  const assertNoOverflow = async () => {
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      'The comparison workbench does not overflow horizontally',
    );
    const bounds = await page.locator('.comparison-viewport').boundingBox();
    assert.ok(
      bounds && bounds.width > 150 && bounds.height > 70,
      JSON.stringify(bounds),
    );
  };

  await page.goto(base + '/?scale=pc');
  await page.waitForFunction(
    () => document.querySelector('.viewport')?.dataset.cameraSettled === 'true',
    undefined,
    { timeout: 60000 },
  );
  await click('Compare components');
  await ready();
  console.log(
    'Checking independent choices, categories, system filters and search',
  );
  await choose('A', 'legioncpu');
  await choose('B', 'ryzen');
  await ready('legioncpu:ryzen');
  let dialog = await openPicker('A');
  await clearFilters(dialog);
  assert.equal(await dialog.locator('button[data-level]').count(), 68);
  assert.equal(
    await dialog.locator('button[data-level="ryzen"]').isDisabled(),
    true,
  );
  await click(
    'Processors',
    dialog.getByRole('navigation', { name: 'Part categories' }),
  );
  assert.equal(
    await dialog.locator('button[data-level="legioncpu"]').count(),
    1,
  );
  assert.equal(await dialog.locator('button[data-level="nvme"]').count(), 0);
  await dialog.getByLabel('System', { exact: true }).selectOption('macbook');
  assert.equal(await dialog.locator('button[data-level="maccpu"]').count(), 1);
  assert.equal(
    await dialog.locator('button[data-level="legioncpu"]').count(),
    0,
  );
  await dialog
    .getByRole('textbox', { name: 'Search parts' })
    .fill('zz-no-such-part-zz');
  assert.equal(await dialog.locator('button[data-level]').count(), 0);
  assert.match(await dialog.innerText(), /No matching parts/);
  await clearFilters(dialog);
  await dialog.getByRole('textbox', { name: 'Search parts' }).fill('5800H');
  assert.equal(
    await dialog.locator('button[data-level="legioncpu"]').count(),
    1,
  );
  assert.equal(await dialog.locator('button[data-level="nvme"]').count(), 0);
  await capture('comparison-picker');
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(
    await page
      .getByRole('button', { name: 'Choose part A', exact: true })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await ready('legioncpu:ryzen');
  await click('Specs');
  await page.locator('.comparison-specs-grid').waitFor();
  const cpuSpecs = await page.locator('.comparison-specs-grid').innerText();
  // Shared labels align; fields only one catalogue entry lists stay visible
  // as gaps instead of borrowing values from another part.
  assert.match(cpuSpecs, /Cores\t8 cores \/ 16 threads\t16 cores, 32 threads/);
  assert.match(cpuSpecs, /Architecture\tNot listed\tZen 5/);
  assert.doesNotMatch(
    await page.locator('.comparison-specs').innerText(),
    /undefined|NaN/,
  );
  await capture('comparison-cpu-specs');
  await click('Close specification comparison');

  console.log(
    'Checking arbitrary physical/logical pairs and independent specifications',
  );
  await choose('B', 'nvme');
  assert.equal(
    await page
      .getByRole('button', { name: 'True size', exact: true })
      .isDisabled(),
    true,
  );
  await click('Specs');
  await page.locator('.comparison-spec-card').first().waitFor();
  assert.equal(await page.locator('.comparison-spec-card').count(), 2);
  assert.equal(await page.locator('.comparison-specs-grid').count(), 0);
  assert.doesNotMatch(
    await page.locator('.comparison-specs').innerText(),
    /undefined|NaN/,
  );
  await capture('comparison-mixed-specs');
  await click('Close specification comparison');
  await click('Swap comparison sides');
  await ready('nvme:legioncpu');
  await capture('comparison-mixed');
  await click('Dissection');
  await ready('nvme:legioncpu', 50);
  await click('Reset camera and assembly');
  await ready('nvme:legioncpu');

  console.log('Checking physical scale and cross-system storage');
  await choose('A', 'ssd');
  await choose('B', 'legionstorage');
  assert.equal(
    await page
      .getByRole('button', { name: 'True size', exact: true })
      .isDisabled(),
    false,
  );
  await click('True size');
  await ready('ssd:legionstorage');
  assert.equal(
    await page
      .getByRole('button', { name: 'True size', exact: true })
      .getAttribute('aria-pressed'),
    'true',
  );
  await capture('comparison-true-size');
  await choose('B', 'maccpu');
  assert.equal(
    await page
      .getByRole('button', { name: 'Fit each', exact: true })
      .getAttribute('aria-pressed'),
    'true',
  );
  assert.equal(
    await page
      .getByRole('button', { name: 'True size', exact: true })
      .isDisabled(),
    true,
  );
  await choose('A', 'macbattery');
  await choose('B', 'legionbattery');
  await ready('macbattery:legionbattery');

  console.log(
    'Checking responsive picker, specifications and visible-side controls',
  );
  for (const [width, height] of [
    [390, 844],
    [320, 740],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await ready('macbattery:legionbattery');
    await assertNoOverflow();
    if (width < 700) {
      await click('B · Right');
      await page.waitForFunction(
        () =>
          document.querySelector('.comparison-viewport')?.dataset.mode ===
          'right',
      );
      await click('A · Left');
      await page.waitForFunction(
        () =>
          document.querySelector('.comparison-viewport')?.dataset.mode ===
          'left',
      );
    }
    await capture(`comparison-${width}`);
    dialog = await openPicker('B');
    await clearFilters(dialog);
    const bounds = await dialog.boundingBox();
    assert.ok(
      bounds &&
        bounds.x >= -1 &&
        bounds.y >= -1 &&
        bounds.x + bounds.width <= width + 1 &&
        bounds.y + bounds.height <= height + 1,
      JSON.stringify(bounds),
    );
    await dialog.getByRole('textbox', { name: 'Search parts' }).fill('display');
    assert.ok((await dialog.locator('button[data-level]').count()) >= 2);
    await capture(`comparison-${width}-picker`);
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    await click('Specs');
    await page.locator('.comparison-specs').waitFor();
    await assertNoOverflow();
    await capture(`comparison-${width}-specs`);
    await click('Close specification comparison');
  }

  console.log(
    'Checking keyboard, exit focus, explorer preservation and ordinary motion',
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole('button', { name: 'Choose part B', exact: true })
    .focus();
  await page.keyboard.press('Enter');
  dialog = page.getByRole('dialog', { name: 'Choose part B' });
  await dialog.waitFor();
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  await click('Back to explorer');
  await page.waitForFunction(
    () => document.querySelector('.viewport')?.dataset.level === 'pc',
  );
  assert.equal(
    await page
      .getByRole('button', { name: 'Compare components', exact: true })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await click('Compare components');
  await ready();
  await choose('A', 'nvme');
  await choose('B', 'maccell');
  await click('Dissection');
  await ready('nvme:maccell', 50);
  await click('Reset camera and assembly');
  await ready('nvme:maccell');
  await click('Back to explorer');
  assert.deepEqual(errors, []);
  console.log(
    'Comparison smoke passed: all systems, categories, search, independent choices, duplicate exclusion, specs, swap, scale modes, disassembly, responsive layouts, keyboard, focus and both motion preferences.',
  );
} finally {
  await browser.close();
}
