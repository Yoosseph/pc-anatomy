import * as T from 'three';
import { byId } from './manifest';

export const siliconColor: Record<string, string> = {
  gpc: '#264c69',
  tpc: '#326382',
  sm: '#356f95',
  cuda: '#467d9c',
  tensor: '#ad7e3c',
  scheduler: '#b77b4c',
  register: '#367785',
  texture: '#786798',
  loadstore: '#468a9b',
  sfu: '#6879a2',
  controller: '#397a8b',
  gddr7: '#1d2731',
  vrm: '#59636b',
  powerstage: '#18222b',
};

/** Original diagram textures encode resource identity, not transistor placement. */
export function resourceTexture(id: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const c = canvas.getContext('2d')!,
    accent = siliconColor[id] ?? '#467d9c';
  c.fillStyle = '#111b26';
  c.fillRect(0, 0, 1024, 512);
  c.strokeStyle = accent;
  c.lineWidth = 8;
  c.strokeRect(12, 12, 1000, 488);
  c.fillStyle = accent;
  c.fillRect(28, 28, 8, 72);
  c.textAlign = 'left';
  c.fillStyle = '#e0eaf3';
  c.font = '600 58px monospace';
  c.fillText(byId[id].shortName.toUpperCase(), 58, 88, 870);
  c.strokeStyle = '#29404f';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(40, 114);
  c.lineTo(980, 114);
  c.stroke();
  const tile = (x: number, y: number, w: number, h: number, label?: string) => {
    c.fillStyle = accent;
    c.globalAlpha = 0.55;
    c.fillRect(x, y, w, h);
    c.globalAlpha = 1;
    c.strokeStyle = '#91afc0';
    c.lineWidth = 2;
    c.strokeRect(x, y, w, h);
    if (label) {
      c.fillStyle = '#e2ebee';
      c.font = '500 30px monospace';
      c.textAlign = 'center';
      c.fillText(label, x + w / 2, y + h / 2 + 10, w - 12);
    }
  };
  if (id === 'sm') {
    for (let q = 0; q < 4; q++) {
      const x = 44 + q * 236;
      tile(x, 145, 214, 305);
      for (let k = 0; k < 32; k++) {
        c.fillStyle = '#87b4d0';
        c.fillRect(x + 13 + (k % 4) * 49, 170 + Math.floor(k / 4) * 24, 36, 15);
      }
      c.fillStyle = '#c79a57';
      c.fillRect(x + 14, 374, 185, 50);
    }
  } else if (id === 'tpc') {
    tile(45, 158, 446, 290, 'SM');
    tile(530, 158, 446, 290, 'SM');
  } else if (id === 'gpc') {
    c.textAlign = 'left';
    c.fillStyle = '#81a7c0';
    c.font = '28px monospace';
    c.fillText('GRAPHICS PROCESSING CLUSTER', 48, 162);
    for (let j = 0; j < 3; j++) {
      c.strokeStyle = '#496b83';
      c.lineWidth = 6;
      c.beginPath();
      c.moveTo(75, 215 + j * 79);
      c.lineTo(320, 215 + j * 79);
      c.lineTo(370, 240 + j * 65);
      c.lineTo(920, 240 + j * 65);
      c.stroke();
    }
    c.fillStyle = '#adc8d6';
    for (let j = 0; j < 3; j++) c.fillRect(920, 226 + j * 65, 24, 24);
  } else if (id === 'tensor') {
    for (let i = 0; i < 64; i++)
      tile(190 + (i % 8) * 78, 146 + Math.floor(i / 8) * 39, 60, 28);
  } else if (id === 'register') {
    for (let i = 0; i < 16; i++) tile(45 + i * 59, 158, 42, 284);
  } else if (id === 'scheduler') {
    for (let i = 0; i < 4; i++) {
      tile(45 + i * 235, 171, 165, 220);
      c.fillStyle = '#bfa17b';
      c.beginPath();
      c.moveTo(221 + i * 235, 242);
      c.lineTo(245 + i * 235, 274);
      c.lineTo(221 + i * 235, 306);
      c.fill();
    }
  } else if (id === 'cuda') {
    for (let i = 0; i < 3; i++) {
      tile(72, 145 + i * 100, 210, 72);
      tile(367, 145 + i * 100, 290, 72);
      tile(740, 145 + i * 100, 210, 72);
      c.strokeStyle = '#9bc1d2';
      c.beginPath();
      c.moveTo(282, 181 + i * 100);
      c.lineTo(367, 181 + i * 100);
      c.moveTo(657, 181 + i * 100);
      c.lineTo(740, 181 + i * 100);
      c.stroke();
    }
  } else if (id === 'gddr7' || id === 'powerstage' || id === 'vrm') {
    c.fillStyle = '#78909e';
    c.font = '34px monospace';
    c.textAlign = 'left';
    c.fillText(id === 'gddr7' ? 'MEMORY PACKAGE' : 'POWER DELIVERY', 58, 188);
    for (let i = 0; i < 28; i++) {
      c.fillStyle = '#84959c';
      c.fillRect(55 + i * 32, 350, 12 + (i % 3) * 3, 80);
    }
  } else {
    for (let j = 0; j < 4; j++) tile(45 + j * 235, 156, 210, 288);
  }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
