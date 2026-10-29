import { chromium } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';

// Run capture-ad.mjs first, with the Vite server running on port 5173.
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
await mkdir('docs/media', { recursive: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
  });
  await page.goto('http://127.0.0.1:5173/');
  await page.setContent(
    '<html><body style="margin:0;background:#0c1013"><canvas width="1080" height="1920"></canvas></body></html>',
  );
  await page.evaluate(async () => {
    const base = 'http://127.0.0.1:5173';
    const videos = {};
    for (const name of [
      'tower',
      'disassemble',
      'gpu',
      'memory',
      'cell',
      'power',
    ]) {
      const video = document.createElement('video');
      video.src = `${base}/outputs/ad-video/${name}.mp4`;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      await new Promise((resolve, reject) => {
        video.onloadeddata = resolve;
        video.onerror = reject;
      });
      videos[name] = video;
    }
    const loadImage = async (path) => {
      const img = new Image();
      img.src = base + path;
      await img.decode();
      return img;
    };
    const logo = await loadImage('/favicon.svg');
    const build = {};
    for (const id of ['mismatch', 'fits']) {
      build[id] = {
        memory: await loadImage(`/outputs/ad-video/memory-${id}.png`),
        check: await loadImage(`/outputs/ad-video/check-${id}.png`),
      };
    }
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    const scenes = [
      {
        start: 0,
        end: 2,
        clip: 'tower',
        tag: 'YOUR NEXT RABBIT HOLE',
        title: ['DON’T UNSCREW', 'YOUR PC.'],
        accent: 1,
        caption: 'Take this one apart instead.',
        detail: 'Interactive 3D. Zero screwdrivers.',
      },
      {
        start: 2,
        end: 6,
        clip: 'disassemble',
        tag: '01 / TAKE IT APART',
        title: ['MEET', 'PC ANATOMY.'],
        accent: 1,
        caption: 'One machine. Layers of discovery.',
        detail: 'Drag. Explore. Understand.',
      },
      {
        start: 6,
        end: 10,
        clip: 'gpu',
        tag: '02 / KEEP GOING',
        title: ['INSIDE', 'YOUR GPU.'],
        accent: 1,
        caption: 'Peel back the graphics card.',
        detail: 'Cooling → circuit board → processor',
      },
      {
        start: 10,
        end: 12,
        clip: 'memory',
        tag: '03 / SMALLER. DEEPER.',
        title: ['FROM RAM…'],
        accent: 0,
        caption: 'Explore what holds your data.',
        detail: 'Open the memory module.',
      },
      {
        start: 12,
        end: 14,
        clip: 'cell',
        tag: '03 / SMALLER. DEEPER.',
        title: ['…TO ONE BIT.'],
        accent: 0,
        caption: 'Down to a memory cell.',
        detail: 'An illustrative view of how memory works.',
      },
      {
        start: 14,
        end: 18,
        clip: 'power',
        tag: '04 / CONNECT THE DOTS',
        title: ['FOLLOW', 'THE POWER.'],
        accent: 1,
        caption: 'See where the power goes.',
        detail: 'From the supply to the components.',
      },
      {
        start: 18,
        end: 23,
        clip: 'tower',
        tag: '05 / BUILD WITH UNDERSTANDING',
        title: ['PICK PARTS.', 'CHECK THE FIT.'],
        accent: 1,
        caption: 'Explore build compatibility.',
        detail: 'Choose from the modeled components.',
        build: true,
      },
      {
        start: 23,
        end: 26,
        clip: 'disassemble',
        tag: 'CURIOSITY COSTS NOTHING',
        title: ['ALL FREE.', 'IN YOUR BROWSER.'],
        accent: 0,
        caption: 'Your next “oh, THAT’S how” moment.',
        detail: 'No download needed to explore.',
      },
      {
        start: 26,
        end: 30,
        clip: 'tower',
        tag: 'GO DEEPER.',
        title: ['TAKE YOUR', 'FIRST PC APART.'],
        accent: 1,
        caption: 'pc-anatomy.com',
        detail: 'EXPLORE FREE →',
        cta: true,
      },
    ];
    const ease = (x) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
    const text = (s, x, y, size, color = '#edf2f4', weight = 700) => {
      ctx.font = `${weight} ${size}px "Segoe UI", Arial, sans-serif`;
      ctx.fillStyle = color;
      ctx.fillText(s, x, y);
    };
    let active = -1;
    const draw = (t) => {
      const index = scenes.findIndex((s) => t >= s.start && t < s.end);
      const s = scenes[index < 0 ? scenes.length - 1 : index];
      const elapsed = t - s.start;
      if (active !== index) {
        Object.values(videos).forEach((v) => v.pause());
        videos[s.clip].currentTime = 0;
        videos[s.clip].play();
        active = index;
      }
      ctx.fillStyle = '#0c1013';
      ctx.fillRect(0, 0, 1080, 1920);
      const glow = ctx.createRadialGradient(900, 750, 20, 600, 800, 1000);
      glow.addColorStop(0, '#1e3036');
      glow.addColorStop(1, '#0c1013');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 1080, 1920);
      ctx.drawImage(logo, 70, 100, 62, 62);
      text('PC Anatomy', 151, 145, 36);
      text('TAKE IT APART. FIGURE IT OUT.', 70, 212, 20, '#92a3ab', 600);
      text(s.tag, 70, 285, 23, '#a1d9e2', 700);
      const enter = ease(elapsed / 0.3);
      ctx.save();
      ctx.globalAlpha = enter;
      ctx.translate(0, (1 - enter) * 24);
      s.title.forEach((line, i) => {
        let size = 78;
        ctx.font = `800 ${size}px "Segoe UI", Arial`;
        while (ctx.measureText(line).width > 940) {
          size--;
          ctx.font = `800 ${size}px "Segoe UI", Arial`;
        }
        text(
          line,
          66,
          380 + i * 91,
          size,
          i === s.accent ? '#a1d9e2' : '#f4f5f6',
          800,
        );
      });
      ctx.restore();
      const box = { x: 42, y: 523, w: 996, h: 860 };
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(box.x, box.y, box.w, box.h, 30);
      ctx.clip();
      ctx.fillStyle = '#0e1011';
      ctx.fillRect(box.x, box.y, box.w, box.h);
      const v = videos[s.clip];
      const zoom = 1.02 + Math.min(1, elapsed / (s.end - s.start)) * 0.045;
      const scale =
        Math.min(box.w / v.videoWidth, box.h / v.videoHeight) * zoom;
      const w = v.videoWidth * scale,
        h = v.videoHeight * scale;
      ctx.drawImage(v, box.x + (box.w - w) / 2, box.y + (box.h - h) / 2, w, h);
      if (s.build) {
        // Real UI captures of the memory choices and their specific check.
        const state = elapsed < 2.4 ? 'mismatch' : 'fits';
        const images = build[state];
        ctx.fillStyle = 'rgba(10,16,19,0.88)';
        ctx.fillRect(box.x, box.y, box.w, box.h);
        const x = 165,
          width = 750;
        text(
          state === 'fits' ? 'THE RIGHT GENERATION.' : 'WILL THIS RAM FIT?',
          120,
          625,
          38,
          state === 'fits' ? '#a1d9e2' : '#eed59d',
        );
        const memoryHeight =
          (images.memory.height * width) / images.memory.width;
        ctx.drawImage(images.memory, x, 680, width, memoryHeight);
        const checkScale = Math.min(
          width / images.check.width,
          64 / images.check.height,
        );
        const checkWidth = images.check.width * checkScale;
        ctx.drawImage(
          images.check,
          540 - checkWidth / 2,
          1280,
          checkWidth,
          images.check.height * checkScale,
        );
      }
      ctx.restore();
      ctx.strokeStyle = '#30434a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(box.x, box.y, box.w, box.h, 30);
      ctx.stroke();
      text('ACTUAL PC ANATOMY CAPTURE', 70, 1424, 18, '#81969f', 600);
      if (s.cta) {
        text(s.caption, 70, 1535, 76, '#ffffff', 800);
        const gradient = ctx.createLinearGradient(70, 0, 1000, 0);
        gradient.addColorStop(0, '#a1d9e2');
        gradient.addColorStop(1, '#b497cf');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(70, 1580, 940, 110, 18);
        ctx.fill();
        text(s.detail, 300, 1652, 39, '#141a20', 800);
      } else {
        let size = 43;
        ctx.font = `700 ${size}px "Segoe UI", Arial`;
        while (ctx.measureText(s.caption).width > 940) {
          size--;
          ctx.font = `700 ${size}px "Segoe UI", Arial`;
        }
        text(s.caption, 70, 1525, size);
        text(s.detail, 70, 1588, 28, '#a5b5bd', 500);
        text('pc-anatomy.com', 70, 1680, 32, '#a1d9e2', 700);
      }
      scenes.forEach((shot, i) => {
        const x = 70 + i * 105;
        ctx.fillStyle = '#28363d';
        ctx.fillRect(x, 1753, 93, 5);
        const progress = Math.max(
          0,
          Math.min(1, (t - shot.start) / (shot.end - shot.start)),
        );
        ctx.fillStyle = '#a1d9e2';
        ctx.fillRect(x, 1753, 93 * progress, 5);
      });
      // A short bright edge on cuts, without full-screen flashing.
      if (elapsed < 0.17 && t > 0.5) {
        ctx.fillStyle = `rgba(161,217,226,${(1 - elapsed / 0.17) * 0.65})`;
        ctx.fillRect(0, 523, 7, 860);
      }
    };
    window.ad = { canvas, videos, draw, scenes };
    draw(0.6);
  });
  // A poster and representative frames are also useful for review.
  for (const t of [1, 4, 8, 13, 16, 20, 24, 28]) {
    await page.evaluate(async (t) => {
      window.ad.draw(t);
      const s = window.ad.scenes.find((s) => t >= s.start && t < s.end);
      const v = window.ad.videos[s.clip];
      v.pause();
      v.currentTime = Math.min(1, v.duration / 2);
      await new Promise((resolve) =>
        v.addEventListener('seeked', resolve, { once: true }),
      );
      window.ad.draw(t);
    }, t);
    await page.screenshot({ path: `outputs/ad-video/review-${t}.png` });
  }
  await writeFile(
    'docs/media/pc-anatomy-ad-poster.png',
    await readFile('outputs/ad-video/review-28.png'),
  );
  const data = await page.evaluate(async () => {
    const { canvas, draw } = window.ad;
    const audio = new AudioContext({ sampleRate: 48000 });
    await audio.resume();
    const destination = audio.createMediaStreamDestination();
    const master = audio.createGain();
    master.gain.value = 0.24;
    master.connect(destination);
    const startAudio = audio.currentTime + 0.15;
    const tone = (
      at,
      frequency,
      duration,
      volume,
      type = 'sine',
      endFrequency = frequency,
    ) => {
      const osc = audio.createOscillator(),
        gain = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, at);
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, endFrequency),
        at + duration,
      );
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(volume, at + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      osc.connect(gain);
      gain.connect(master);
      osc.start(at);
      osc.stop(at + duration);
    };
    // Original synthesized rhythm: no third-party music assets.
    const beat = 60 / 128;
    for (let i = 0; i * beat < 29.5; i++) {
      const at = startAudio + i * beat;
      tone(at, 130, 0.19, 0.8, 'sine', 42);
      const bass = [65.41, 65.41, 77.78, 58.27][Math.floor(i / 8) % 4];
      tone(at, bass, 0.3, 0.19, 'triangle');
      tone(at + beat / 2, 2500, 0.035, 0.06, 'triangle', 1400);
      if (i % 2 === 1) tone(at, 190, 0.075, 0.19, 'triangle', 95);
      const note = [261.63, 311.13, 392, 466.16][i % 4];
      tone(at + beat / 2, note, 0.18, 0.075, 'sine');
    }
    for (const s of window.ad.scenes.slice(1))
      tone(startAudio + s.start, 880, 0.14, 0.16, 'sine', 220);
    master.gain.setValueAtTime(0.24, startAudio + 28.8);
    master.gain.linearRampToValueAtTime(0, startAudio + 30);
    const stream = canvas.captureStream(30);
    destination.stream
      .getAudioTracks()
      .forEach((track) => stream.addTrack(track));
    const mimeType = 'video/mp4;codecs=avc1.42001f,mp4a.40.2';
    if (!MediaRecorder.isTypeSupported(mimeType))
      throw new Error('H.264/AAC MP4 recording is unavailable in this browser');
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 2400000,
      audioBitsPerSecond: 128000,
    });
    const chunks = [];
    const stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = (e) => reject(e.error);
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
    });
    recorder.start(1000);
    const start = performance.now();
    await new Promise((resolve) => {
      const frame = (now) => {
        const t = (now - start) / 1000;
        draw(Math.min(t, 29.999));
        if (t >= 30) resolve();
        else requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((track) => track.stop());
    await audio.close();
    const blob = new Blob(chunks, { type: 'video/mp4' });
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });
  });
  const buffer = Buffer.from(data, 'base64');
  if (buffer.length < 100000)
    throw new Error('Recording is unexpectedly small');
  await writeFile('docs/media/pc-anatomy-ad-30s.mp4', buffer);
  console.log('Saved MP4:', (buffer.length / 1024 / 1024).toFixed(2), 'MB');
} finally {
  await browser.close();
}
