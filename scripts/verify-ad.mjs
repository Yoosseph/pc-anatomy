import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
  });
  await page.goto('http://127.0.0.1:5173/');
  await page.setContent(
    '<body style="margin:0"><canvas width="1080" height="1920"></canvas></body>',
  );
  const result = await page.evaluate(async () => {
    const url = 'http://127.0.0.1:5173/docs/media/pc-anatomy-ad-30s.mp4';
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    await new Promise((resolve, reject) => {
      video.onloadeddata = resolve;
      video.onerror = reject;
    });
    window.video = video;
    const audio = new AudioContext();
    const data = await audio.decodeAudioData(
      await (await fetch(url)).arrayBuffer(),
    );
    let sum = 0,
      peak = 0;
    const samples = data.getChannelData(0);
    for (const sample of samples) {
      sum += sample * sample;
      peak = Math.max(peak, Math.abs(sample));
    }
    await audio.close();
    return {
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
      audioDuration: data.duration,
      audioRms: Math.sqrt(sum / samples.length),
      audioPeak: peak,
    };
  });
  assert.equal(result.width, 1080);
  assert.equal(result.height, 1920);
  assert.ok(
    result.duration >= 29.9 && result.duration <= 30.5,
    '30-second duration',
  );
  assert.ok(
    result.audioRms > 0.005 && result.audioPeak < 1,
    'audible, unclipped soundtrack',
  );
  for (const t of [1, 4, 8, 11, 13, 16, 20, 22, 28]) {
    await page.evaluate(async (t) => {
      const video = window.video;
      video.currentTime = t;
      await new Promise((resolve) =>
        video.addEventListener('seeked', resolve, { once: true }),
      );
      document.querySelector('canvas').getContext('2d').drawImage(video, 0, 0);
    }, t);
    await page.screenshot({ path: `outputs/ad-video/verified-${t}.png` });
  }
  console.log(JSON.stringify(result, null, 2));
  console.log(
    'MP4 dimensions, duration, audio, and nine decoded sample frames verified.',
  );
} finally {
  await browser.close();
}
