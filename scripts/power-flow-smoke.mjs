import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.POWER_BASE_URL ?? 'http://127.0.0.1:5173';
const output = process.env.POWER_SCREENSHOTS ?? 'outputs/power-flow';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args:
    process.env.POWER_SOFTWARE === '1'
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
      .evaluate((button) => button.click());
  };
  const ready = async (level = 'pc', explode = 0) => {
    await page.waitForFunction(
      ({ level, explode }) => {
        const d = document.querySelector('.viewport')?.dataset;
        return (
          d?.level === level &&
          Number(d.explode) === explode &&
          d.cameraSettled === 'true' &&
          Number(d.triangles) > 0
        );
      },
      { level, explode },
      { timeout: 60000 },
    );
    assert.deepEqual(errors, []);
  };
  const routes = (expected) =>
    page.waitForFunction(
      (expected) =>
        document.querySelector('.viewport')?.dataset.powerRoutes === expected,
      expected,
      { timeout: 30000 },
    );
  const capture = (name) =>
    page.screenshot({ path: `${output}/${name}.png`, timeout: 60000 });
  await page.goto(base);
  await ready();
  await routes('');
  await capture('power-before');
  await click('Show power flow');
  await routes('atx,eps,gpu,sata,slot');
  await capture('power-all');
  for (const [target, expected] of [
    ['CPU', 'eps'],
    ['GPU', 'atx,gpu,slot'],
    ['Storage', 'sata'],
  ]) {
    await click(target);
    await routes(expected);
    await capture(`power-${target.toLowerCase()}`);
  }
  await click('GPU');
  await click('Hide Board');
  await routes('gpu');
  await click('Show Board');
  await routes('atx,gpu,slot');
  await click('Inspect Graphics card: 12V-2x6');
  await page
    .getByRole('heading', { name: 'Graphics card', exact: true })
    .waitFor();
  await click('Isolate');
  await routes('');
  await click('Show context');
  await routes('atx,gpu,slot');
  await click('Hide');
  await routes('atx');
  await click('Show Graphics card');
  await routes('atx,gpu,slot');
  await click('Dissection');
  await ready('pc', 50);
  await routes('');
  assert.match(await page.locator('.power-status').innerText(), /Reassemble/);
  await click('Assembled');
  await ready();
  await routes('atx,gpu,slot');
  await click('Inspect Graphics card: 12V-2x6');
  await page
    .getByRole('button', { name: /^Take apart / })
    .evaluate((button) => button.click());
  await ready('card');
  assert.equal(await page.locator('.power-toggle').count(), 0);
  await page.goBack();
  await ready();
  await routes('atx,gpu,slot');
  await click('Reset camera and assembly');
  await ready();
  await routes('');
  assert.equal(await page.locator('.power-panel').count(), 0);
  await click('Show power flow');
  await click('CPU');
  await routes('eps');
  // Keyboard activation while reduced motion is enabled.
  await page.getByRole('button', { name: 'GPU', exact: true }).focus();
  await page.keyboard.press('Enter');
  await routes('atx,gpu,slot');
  for (const [width, height] of [
    [390, 844],
    [320, 740],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await ready();
    const bounds = await page.locator('.power-panel').boundingBox();
    assert.ok(
      bounds &&
        bounds.x >= 0 &&
        bounds.y >= 0 &&
        bounds.x + bounds.width <= width + 1 &&
        bounds.y + bounds.height <= height,
      JSON.stringify(bounds),
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      'No horizontal overflow',
    );
    await capture(`power-mobile-${width}`);
    if (width <= 700) {
      assert.equal(await page.locator('.power-legend').isVisible(), false);
      await click('Details');
      assert.equal(await page.locator('.power-legend').isVisible(), true);
      await capture(`power-mobile-${width}-details`);
      await click('Less');
    }
  }
  assert.deepEqual(errors, []);
  // The stage reads the motion preference when mounted. Reload to exercise
  // the ordinary animated mode as well as the static mode above.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload();
  await ready();
  await click('Show power flow');
  await routes('atx,eps,gpu,sata,slot');
  await click('Hide power flow');
  await routes('');
  assert.deepEqual(errors, []);
  console.log(
    'Power flow: filters, inspection, visibility, isolation, disassembly, navigation, reset, keyboard, motion preferences and responsive layouts passed.',
  );
} finally {
  await browser.close();
}
