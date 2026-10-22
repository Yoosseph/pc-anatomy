import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 800 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const request = window.requestAnimationFrame.bind(window);
    window.__frameCount = 0;
    window.requestAnimationFrame = (callback) =>
      request((time) => {
        window.__frameCount++;
        callback(time);
      });
    sessionStorage.setItem('pc-anatomy-performance-tip-v1', '1');
  });
  const base = process.env.NOTEBOOK_BASE_URL ?? 'http://127.0.0.1:5173';
  await page.goto(base + '/?scale=maccell');
  await page.waitForFunction(
    () => document.querySelector('.viewport')?.dataset.cameraSettled === 'true',
    null,
    { timeout: 60000 },
  );
  const count = () => page.evaluate(() => window.__frameCount);
  const sleeps = async () => {
    // Allow OrbitControls damping to finish before measuring the idle window.
    await page.waitForTimeout(1500);
    const before = await count();
    await page.waitForTimeout(500);
    assert.equal(
      await count(),
      before,
      'a static stage kept scheduling frames',
    );
  };
  await sleeps();
  const host = await page.locator('.viewport').boundingBox();
  assert.ok(host);
  const before = await count();
  await page.mouse.move(host.x + host.width / 2, host.y + host.height / 2);
  await sleeps();
  assert.ok(
    (await count()) > before,
    'pointer input did not wake the sleeping stage',
  );
  await page.mouse.move(host.x + 20, host.y + 20);
  await sleeps();
  assert.deepEqual(errors, []);
  console.log(
    'Performance smoke passed: idle sleep, hover wake, return to sleep, no page errors.',
  );
} finally {
  await browser.close();
}
