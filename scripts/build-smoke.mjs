import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

/**
 * The build workspace in a real browser: open it from the explorer, swap
 * every slot that changes the tower, read the checks, follow a shared link,
 * leave for the explorer with the same scene, take the installed card apart,
 * and come back with the build kept. Each part choice is timed from the click
 * to the next frame, so a rebuild that blocks the click fails the run.
 * Screenshots land in `outputs/build`.
 */
const base = process.env.BUILD_BASE_URL ?? 'http://127.0.0.1:5173';
const output = process.env.BUILD_SCREENSHOTS ?? 'outputs/build';
/** Click to next frame. A tower rebuild on that path takes 300 ms or more. */
const RESPONSIVE_MS = 150;
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
  /** The model on the stage: the tower is one per cooler, card, drives and supply. */
  const model = (on = page) =>
    on.evaluate(() => document.querySelector('.viewport')?.dataset.model);
  /**
   * A part in the workspace, by the start of its name. Returns how long the
   * page took from the click to its next frame, and checks the choice was
   * already showing by then.
   */
  const pick = async (name) => {
    const option = page.locator('.build-option').filter({ hasText: name });
    const { ms, pressed } = await option.evaluate(
      (button) =>
        new Promise((resolve) => {
          const start = performance.now();
          button.click();
          requestAnimationFrame(() =>
            resolve({
              ms: performance.now() - start,
              pressed: button.getAttribute('aria-pressed'),
            }),
          );
        }),
    );
    console.log(`Pick: ${name} (${ms.toFixed(0)} ms to the next frame)`);
    assert.equal(pressed, 'true', `${name} shows as chosen at once`);
    assert.ok(ms < RESPONSIVE_MS, `${name} held the page for ${ms} ms`);
  };
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
      (before) => document.querySelector('.viewport')?.dataset.model !== before,
      before,
      { timeout: 60000 },
    );
    await page.locator('.build-fitting:not(.active)').waitFor();
    await ready();
    await settled();
  };
  /**
   * Wait for the page to be idle again: five frames in a row under 40 ms.
   * A new tower finishes compiling its materials on the GPU after it is
   * shown, and a rebuild that never settles is lag too.
   */
  const settled = () =>
    page.evaluate(
      () =>
        new Promise((resolve, reject) => {
          const give = setTimeout(
            () => reject(new Error('never settled')),
            15000,
          );
          let last = performance.now(),
            calm = 0;
          const frame = (now) => {
            calm = now - last < 40 ? calm + 1 : 0;
            last = now;
            if (calm >= 5) {
              clearTimeout(give);
              resolve();
            } else requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        }),
    );
  const summary = () => page.locator('.build-summary').innerText();
  const capture = (name) =>
    page.screenshot({ path: `${output}/${name}.png`, timeout: 60000 });
  const noSideScroll = () =>
    page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

  await page.goto(base);
  await ready();
  // Opening the workspace keeps the tower the explorer already built.
  let before = await model();
  await page
    .getByRole('button', { name: /Build your own PC/ })
    .evaluate((button) => button.click());
  await page.locator('.build-workbench .build-parts').waitFor();
  await page.waitForURL(/mode=build/);
  await ready();
  assert.equal(await model(), before);
  assert.equal(await page.locator('.topbar').count(), 0);
  assert.equal(await page.locator('.build-slot').count(), 6);
  assert.match(await summary(), /1 thing to check/);
  await settled();
  await capture('build-original');

  before = await model();
  await pick(/^Radeon RX 9070 XT/);
  await rebuilt(before);
  assert.match(await summary(), /Everything works together/);
  await capture('build-radeon');

  before = await model();
  await pick(/^ASUS TUF Gaming 750W Bronze/);
  await rebuilt(before);
  assert.match(await summary(), /problem/);
  await capture('build-radeon-bronze');

  before = await model();
  await pick(/^Intel Arc B580/);
  await rebuilt(before);
  assert.match(await summary(), /Everything works together/);

  // A processor that cannot seat is reported, and the tower does not change.
  before = await model();
  await pick(/^Intel Core Ultra 9 285K/);
  assert.match(await summary(), /problem/);
  assert.equal(await model(), before);
  await pick(/^AMD Ryzen 9 9950X/);

  // The liquid loop goes in, with its radiator at the front.
  before = await model();
  await pick(/^360 mm liquid cooler/);
  await rebuilt(before);
  assert.match(await summary(), /Everything works together/);
  await capture('build-liquid');

  // Without the SATA drive, the tower loses the drive and its lead.
  before = await model();
  await pick(/^M\.2 NVMe SSD only/);
  await rebuilt(before);
  assert.match(await summary(), /Everything works together/);
  await capture('build-liquid-nvme');

  // Two choices inside one frame are one rebuild, for the last: going to the
  // Radeon and straight back to the Arc never builds the Radeon's tower.
  before = await model();
  const seen = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const keys = new Set();
        const options = [...document.querySelectorAll('.build-option')];
        const named = (text) =>
          options.find((o) => o.textContent.includes(text));
        const radeon = named('Radeon RX 9070 XT');
        radeon.click();
        // React renders the first choice in a microtask, well inside the
        // frame the rebuild waits for; the second choice lands before it.
        void Promise.resolve().then(() => {
          if (radeon.getAttribute('aria-pressed') !== 'true')
            keys.add('radeon was not chosen');
          named('Intel Arc B580').click();
        });
        const until = performance.now() + 1500;
        const frame = () => {
          keys.add(document.querySelector('.viewport')?.dataset.model);
          if (performance.now() < until) requestAnimationFrame(frame);
          else resolve([...keys]);
        };
        requestAnimationFrame(frame);
      }),
  );
  assert.deepEqual(seen, [before], 'back on the Arc, nothing rebuilt');

  // The build is in the address, and a link to it opens the workspace on it.
  await page.waitForURL(
    /mode=build&cooler=liquid&gpu=arcb580&storage=nvme&psu=psubronze/,
  );
  assert.doesNotMatch(page.url(), /cpu=/);
  await page.locator('.build-share').evaluate((button) => button.click());
  await page
    .locator('.build-share')
    .filter({ hasText: /Link copied|Copy the address bar/ })
    .waitFor();
  const shared = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  await shared.goto(page.url());
  await shared.locator('.build-workbench .build-parts').waitFor();
  await shared.waitForFunction(
    () => {
      const d = document.querySelector('.viewport')?.dataset;
      return d?.level === 'pc' && Number(d.triangles) > 0;
    },
    null,
    { timeout: 60000 },
  );
  assert.equal(await model(shared), await model());
  assert.match(
    await shared.locator('.build-summary').innerText(),
    /Everything works together/,
  );
  for (const part of [
    /^Intel Arc B580/,
    /^ASUS TUF Gaming 750W Bronze/,
    /^360 mm liquid cooler/,
    /^M\.2 NVMe SSD only/,
  ])
    assert.equal(
      await shared
        .locator('.build-option')
        .filter({ hasText: part })
        .getAttribute('aria-pressed'),
      'true',
    );
  await shared.close();

  // Back to the explorer, on the same scene, and the back button returns.
  before = await model();
  await page.locator('.build-back').evaluate((button) => button.click());
  await page.locator('.topbar').waitFor();
  await ready();
  assert.equal(await model(), before);
  assert.doesNotMatch(page.url(), /mode=build/);
  await page.goBack();
  await page.locator('.build-workbench').waitFor();
  await page.goForward();
  await page.locator('.topbar').waitFor();
  await ready();

  // The installed card describes itself, and opens into its own scale.
  await click('Show power flow');
  await click('Inspect Graphics card: 8-pin PCIe');
  await page
    .getByRole('heading', {
      name: 'Intel Arc B580 Limited Edition',
      exact: true,
    })
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
  await page
    .getByRole('button', { name: /Build your own PC/ })
    .evaluate((button) => button.click());
  await page.locator('.build-workbench').waitFor();
  assert.match(await summary(), /Everything works together/);
  before = await model();
  await click('Back to the original build');
  await rebuilt(before);
  assert.match(await summary(), /1 thing to check/);
  await page.waitForURL(
    (url) => !/gpu=|psu=|cooler=|storage=/.test(url.search),
  );

  // Phones: the tower on top, the parts and the checks taking turns below.
  for (const [width, height] of [
    [390, 844],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await ready();
    assert.ok(await noSideScroll(), `no side scroll at ${width}`);
    await page.locator('.build-tabs [role=tab]').first().waitFor();
    await capture(`build-phone-${width}-parts`);
    await page
      .getByRole('tab', { name: /Checks/ })
      .evaluate((button) => button.click());
    await page.locator('.build-report').waitFor();
    assert.equal(await page.locator('.build-parts').isVisible(), false);
    assert.ok(await noSideScroll(), `no side scroll at ${width}, checks`);
    await capture(`build-phone-${width}-checks`);
    await page
      .getByRole('tab', { name: /Parts/ })
      .evaluate((button) => button.click());
  }
  assert.deepEqual(errors, []);
  console.log('Build smoke passed.');
} finally {
  await browser.close();
}
