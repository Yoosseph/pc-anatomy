import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const output = 'outputs/ad-video';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: [
    '--autoplay-policy=no-user-gesture-required',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
  ],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 900 },
    deviceScaleFactor: process.argv.includes('--build-only') ? 3 : 1,
  });
  await page.addInitScript(() => {
    sessionStorage.setItem('pc-anatomy-performance-tip-v1', '1');
    localStorage.setItem('pc-anatomy-first-visit-hint-v1', '1');
  });
  for (const [name, scale, duration, action] of process.argv.includes(
    '--build-only',
  )
    ? []
    : [
        ['tower', 'pc', 2, null],
        ['disassemble', 'pc', 4, 'Take it apart automatically'],
        ['gpu', 'card', 4, 'Take it apart automatically'],
        ['memory', 'dimm', 2, 'Take it apart automatically'],
        ['cell', 'cell', 2, 'Take it apart automatically'],
        ['power', 'pc', 4, 'Show power flow'],
      ]) {
    console.log('Capturing', name);
    await page.goto(`http://127.0.0.1:5173/?scale=${scale}`);
    await page.waitForFunction(
      () => {
        const d = document.querySelector('.viewport')?.dataset;
        return Number(d?.drawCalls) > 0 && d?.cameraSettled === 'true';
      },
      null,
      { timeout: 120000 },
    );
    await page.evaluate(() => {
      const canvas = document.querySelector('.viewport canvas');
      const stream = canvas.captureStream(30);
      const mimeType = [
        'video/mp4;codecs=avc1.42001f',
        'video/mp4',
        'video/webm;codecs=vp9',
          ].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 4500000,
      });
      recorder.onerror = (e) => console.error('Recording failed', e.error);
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      window.adCapture = { recorder, chunks, stream, mimeType };
      recorder.start();
    });
    if (action)
      await page
        .getByRole('button', { name: action, exact: true })
        .evaluate((b) => b.click());
    await page.waitForTimeout(duration * 1000);
    await page.screenshot({ path: `${output}/${name}-reference.png` });
    const result = await page.evaluate(async () => {
      const { recorder, chunks, stream, mimeType } = window.adCapture;
      await new Promise((resolve) => {
        recorder.onstop = resolve;
        recorder.stop();
      });
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: mimeType });
      const data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
      });
      return { data, mimeType };
    });
    const extension = result.mimeType.includes('mp4') ? 'mp4' : 'webm';
    await writeFile(
      `${output}/${name}.${extension}`,
      Buffer.from(result.data, 'base64'),
    );
    console.log(
      name,
      extension,
      Math.round((result.data.length * 0.75) / 1024),
      'KB',
    );
  }
  await page.goto('http://127.0.0.1:5173/');
  await page.getByRole('button', { name: /Build your own PC/ }).click();
  const memory = page
    .locator('.build-slot')
    .filter({ has: page.getByText('Memory', { exact: true }) });
  const check = page
    .locator('.build-checks li')
    .filter({ hasText: /Memory (does not fit|fits)/ });
  for (const [id, label] of [
    ['mismatch', 'Kingston FURY Beast DDR4-3200'],
    ['fits', 'Kingston FURY Beast DDR5-6000'],
  ]) {
    await page.locator('.build-option').filter({ hasText: label }).click();
    await memory.screenshot({ path: `${output}/memory-${id}.png` });
    await check
      .locator('strong')
      .screenshot({ path: `${output}/check-${id}.png` });
  }
} finally {
  await browser.close();
}
