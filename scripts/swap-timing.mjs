// Time system swaps from the picker: click to the new model's first frame.
// Run against a preview: NOTEBOOK_BASE_URL=http://127.0.0.1:4173 node scripts/swap-timing.mjs
import { chromium } from '@playwright/test';

const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  // Software rendering makes every frame cost seconds, which buries the swap.
  // Use the machine's GPU unless SWAP_SOFTWARE is set.
  args: process.env.SWAP_SOFTWARE
    ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    : ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1400, height: 900 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const base = process.env.NOTEBOOK_BASE_URL ?? 'http://127.0.0.1:5173';
  await page.goto(base + '/?scale=pc');
  await page.waitForFunction(
    () => Number(document.querySelector('.viewport')?.dataset.triangles) > 0,
    null,
    { timeout: 60000 },
  );
  // Navigation start to the first frame with the desktop drawn.
  const firstModel = await page.evaluate(() => Math.round(performance.now()));
  const swap = (name, level) =>
    page.evaluate(
      ([name, level]) =>
        new Promise((resolve) => {
          const button = [
            ...document.querySelectorAll('.system-picker button'),
          ].find((b) => b.querySelector('strong')?.textContent === name);
          const start = performance.now();
          button.click();
          const check = () => {
            const host = document.querySelector('.viewport');
            if (
              host?.dataset.level === level &&
              Number(host.dataset.triangles) > 0
            )
              resolve(Math.round(performance.now() - start));
            else requestAnimationFrame(check);
          };
          requestAnimationFrame(check);
        }),
      [name, level],
    );
  const route = [
    ['Laptops', 'legion'],
    ['Mac', 'macbook'],
    ['Desktop PC', 'pc'],
  ];
  const results = [];
  for (let round = 1; round <= 2; round++)
    for (const [name, level] of route) {
      // Let idle-time work (bounds trees) run, as a reader pausing would.
      await page.waitForTimeout(2500);
      results.push({ round, level, ms: await swap(name, level) });
    }
  console.log('first model drawn after', firstModel, 'ms');
  console.table(results);
  console.log(
    'renderer:',
    await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      const info = gl?.getExtension('WEBGL_debug_renderer_info');
      return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'unknown';
    }),
  );
  if (errors.length) throw new Error(errors.join('\n'));
} finally {
  await browser.close();
}
