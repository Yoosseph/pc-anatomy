import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.NOTEBOOK_BASE_URL ?? 'http://127.0.0.1:5175';
const destination = '.openai/notebook-qa';
await mkdir(destination, { recursive: true });
console.log('Launching notebook visual checks');
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const scales = (
    process.env.NOTEBOOK_SCALES ??
    'legion,macbook,legionboard,macboard,legioncooling,maccooling,legionmemory,legiongpu,legionsm,m1pro,maccpu,macgpu,legioncell,macdisplay'
  ).split(',');
  for (const scale of scales) {
    console.log('Rendering', scale);
    await page.goto(`${base}/?scale=${scale}`, { timeout: 60000 });
    await page.waitForFunction(
      (expected) => {
        const host = document.querySelector('.viewport');
        return (
          host?.getAttribute('data-level') === expected &&
          Number(host?.getAttribute('data-draw-calls')) > 0 &&
          host?.getAttribute('data-camera-settled') === 'true'
        );
      },
      scale,
      { timeout: 60000 },
    );
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          let frames = 0;
          const tick = () =>
            ++frames > 15 ? resolve() : requestAnimationFrame(tick);
          requestAnimationFrame(tick);
        }),
    );
    await page.screenshot({
      path: `${destination}/${scale}.png`,
      timeout: 60000,
    });
    assert.deepEqual(errors, [], scale);
  }
  console.log('Visual checks passed', scales.length);
} finally {
  await browser.close();
}
