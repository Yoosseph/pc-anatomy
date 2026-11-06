import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

// These regressions concern React navigation and sharing, independently of
// geometry. Disable WebGL so they also run on machines without a usable GPU.
const base = process.env.UI_BASE_URL ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--disable-webgl'],
});
const failures = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text) => {
          window.__copiedBuild = text;
        },
      },
    });
    localStorage.setItem('pc-anatomy-first-visit-hint-v1', '1');
  });
  const click = (name) =>
    page
      .getByRole('button', { name, exact: true })
      .evaluate((el) => el.click());
  const check = async (name, run) => {
    try {
      await run();
      console.log(`PASS ${name}`);
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
      console.error(`FAIL ${name}: ${error.message}`);
    }
  };

  await check(
    'Sharing immediately after a swap includes the chosen part',
    async () => {
      await page.goto(`${base}/?scale=pc&mode=build`);
      const slot = page.locator('.build-slot').filter({
        has: page.locator('.build-slot-label', { hasText: 'Graphics card' }),
      });
      await slot.locator('.build-slot-head').evaluate((el) => el.click());
      const option = slot
        .locator('.build-option')
        .filter({ hasText: 'Arc B580' });
      await option.evaluate(async (el) => {
        el.click();
        // Let React commit the choice, without yielding to the 250 ms address timer.
        await new Promise((resolve) => queueMicrotask(resolve));
        document.querySelector('.build-share').click();
      });
      const shared = await page.locator('.build-share-url').innerText();
      assert.equal(new URL(shared).searchParams.get('gpu'), 'arcb580');
      assert.equal(new URL(shared).searchParams.get('mode'), 'build');
      assert.equal(await page.evaluate(() => window.__copiedBuild), shared);
    },
  );

  await check(
    'Standalone parts keep their identity with a custom build',
    async () => {
      await page.goto(`${base}/?scale=cooler&part=cpucooler&cooler=liquid`);
      await page
        .getByRole('heading', { name: 'Processor cooler', exact: true })
        .waitFor();
      assert.equal(await page.title(), 'Processor cooler · PC Anatomy');
      await page.goto(`${base}/?scale=pc&part=graphicscard&gpu=arcb580`);
      await page
        .getByRole('heading', {
          name: 'Intel Arc B580 Limited Edition',
          exact: true,
        })
        .waitFor();
      assert.equal(
        await page.title(),
        'Intel Arc B580 Limited Edition · PC Anatomy',
      );
    },
  );

  await check(
    'Back restores the latest parts after leaving Build immediately',
    async () => {
      await page.goto(`${base}/?scale=pc&mode=build`);
      const slot = page.locator('.build-slot').filter({
        has: page.locator('.build-slot-label', { hasText: 'Graphics card' }),
      });
      await slot.locator('.build-slot-head').evaluate((el) => el.click());
      await slot
        .locator('.build-option')
        .filter({ hasText: 'Arc B580' })
        .evaluate(async (el) => {
          el.click();
          await new Promise((resolve) => queueMicrotask(resolve));
          document.querySelector('.build-back').click();
        });
      await page.locator('.build-topbar').waitFor({ state: 'detached' });
      await page.goBack();
      await page.locator('.build-topbar').waitFor();
      assert.match(
        await slot.locator('.build-slot-text strong').innerText(),
        /Arc B580/,
      );
      assert.equal(new URL(page.url()).searchParams.get('gpu'), 'arcb580');
    },
  );

  await check('Comparison cancels an interrupted explorer dive', async () => {
    await page.goto(`${base}/?scale=pc&part=cpucooler`);
    await page.locator('.open-component').evaluate((el) => el.click());
    await click('Compare components');
    await click('Back to explorer');
    await page
      .getByRole('heading', { name: 'Processor cooler', exact: true })
      .waitFor({ timeout: 1000 });
  });

  await check(
    'Pending edits do not overwrite Back and survive Forward',
    async () => {
      await page.goto(`${base}/?scale=pc`);
      await click('Build your own PC');
      const slot = page.locator('.build-slot').filter({
        has: page.locator('.build-slot-label', { hasText: 'Graphics card' }),
      });
      await slot.locator('.build-slot-head').evaluate((el) => el.click());
      await slot
        .locator('.build-option')
        .filter({ hasText: 'Arc B580' })
        .evaluate(async (el) => {
          el.click();
          await new Promise((resolve) => queueMicrotask(resolve));
          history.back();
        });
      await page.locator('.build-topbar').waitFor({ state: 'detached' });
      await page.waitForTimeout(300);
      assert.equal(new URL(page.url()).searchParams.get('mode'), null);
      assert.equal(new URL(page.url()).searchParams.get('gpu'), null);
      await page.goForward();
      await page.locator('.build-topbar').waitFor();
      assert.match(
        await slot.locator('.build-slot-text strong').innerText(),
        /Arc B580/,
      );
    },
  );

  await check(
    'Choosing a search result stops automatic disassembly',
    async () => {
      await page.goto(`${base}/?scale=sm`);
      await click('Take it apart automatically');
      await click('Find a component');
      await page
        .locator('[cmdk-item][data-value="tensor"]')
        .evaluate((el) => el.click());
      assert.equal(
        await page.locator('.play').getAttribute('aria-label'),
        'Take it apart automatically',
      );
      const progress = await page
        .locator('.disassembly-readout output')
        .innerText();
      await page.waitForTimeout(300);
      assert.equal(
        await page.locator('.disassembly-readout output').innerText(),
        progress,
      );
    },
  );

  await check('Comparison stops the hidden explorer playback', async () => {
    await page.goto(`${base}/?scale=sm`);
    await click('Take it apart automatically');
    await click('Compare components');
    await page.waitForTimeout(300);
    await click('Back to explorer');
    assert.equal(
      await page.locator('.play').getAttribute('aria-label'),
      'Take it apart automatically',
    );
    const progress = await page
      .locator('.disassembly-readout output')
      .innerText();
    await page.waitForTimeout(300);
    assert.equal(
      await page.locator('.disassembly-readout output').innerText(),
      progress,
    );
  });
} finally {
  await browser.close();
}
assert.deepEqual(failures, [], failures.join('\n'));
