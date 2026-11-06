import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

// Run against Vite dev: this exercises the real scene with direct state updates,
// avoiding UI timing races during the 800 ms outgoing dive.
const base = process.env.SCENE_BASE_URL ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({
    viewport: { width: 960, height: 720 },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route(`${base}/`, (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<div id="stage" style="width:900px;height:650px"></div>',
    }),
  );
  await page.goto(`${base}/`);
  await page.evaluate(async () => {
    const { createViewer } = await import('/lib/scene.ts');
    const { initialState } = await import('/lib/explorer-state.ts');
    window.sceneState = { ...initialState, level: 'dimm', airflow: 'off' };
    window.arrivals = 0;
    window.viewer = createViewer(
      document.querySelector('#stage'),
      window.sceneState,
      {
        select() {},
        hover() {},
        stats() {},
        dived() {
          window.arrivals++;
        },
        error(message) {
          throw new Error(message);
        },
      },
    );
  });
  const settled = () =>
    page.waitForFunction(
      () => {
        const d = document.querySelector('#stage').dataset;
        return (
          d.cameraSettled === 'true' &&
          d.transitioning === 'false' &&
          Number(d.triangles) > 0
        );
      },
      undefined,
      { timeout: 15000 },
    );
  await settled();
  const startDive = () =>
    page.evaluate(() => {
      window.sceneState = {
        ...window.sceneState,
        diveInto: 'dramchip',
        diveRevision: window.sceneState.diveRevision + 1,
      };
      window.viewer.update(window.sceneState);
    });
  await startDive();
  await page.waitForFunction(
    () => document.querySelector('#stage').dataset.transitioning === 'true',
  );
  await page.evaluate(() => {
    window.sceneState = { ...window.sceneState, diveInto: null };
    window.viewer.update(window.sceneState);
  });
  await settled();
  assert.equal(
    await page.evaluate(() => window.arrivals),
    0,
    'cancelled same-scale dives must never report arrival',
  );

  // An actual arrival has an incoming ramp even though React cleared diveInto.
  await startDive();
  await page.evaluate(() => {
    window.sceneState = { ...window.sceneState, level: 'dram', diveInto: null };
    window.viewer.update(window.sceneState);
    window.viewer.update({ ...window.sceneState });
  });
  await page.waitForFunction(
    () => document.querySelector('#stage').dataset.transitioning === 'true',
  );
  await settled();
  assert.equal(await page.locator('#stage').getAttribute('data-level'), 'dram');
  assert.deepEqual(errors, []);
  await page.evaluate(() => window.viewer.dispose());
  console.log(
    'PASS same-scale dive cancellation and incoming-ramp preservation',
  );
} finally {
  await browser.close();
}
