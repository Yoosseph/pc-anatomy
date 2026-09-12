import * as T from 'three';

/** Deterministic, locally authored material maps. No downloaded textures. */
export function surfaceTexture(kind: 'brushed' | 'molded' | 'ceramic') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const pixels = ctx.createImageData(256, 256);
  let seed = 7201;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let y = 0; y < 256; y++) {
    const line = random() * 30;
    for (let x = 0; x < 256; x++) {
      const value =
        kind === 'brushed' ? 145 + line + random() * 12 : 130 + random() * 65;
      const offset = (y * 256 + x) * 4;
      pixels.data.set([value, value, value, 255], offset);
    }
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = new T.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(kind === 'brushed' ? 3 : 5, 5);
  texture.anisotropy = 8;
  return texture;
}

export function boardTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#142722';
  ctx.fillRect(0, 0, 2048, 1024);
  // Routed bundles use 45-degree bends; they illustrate routing, not a netlist.
  for (let side = 0; side < 2; side++) {
    ctx.save();
    if (side) {
      ctx.translate(2048, 1024);
      ctx.rotate(Math.PI);
    }
    for (let n = 0; n < 112; n++) {
      const x = 50 + (n % 28) * 17;
      const y = 50 + Math.floor(n / 28) * 246 + (n % 7) * 8;
      ctx.strokeStyle = n % 5 ? '#244237' : '#315243';
      ctx.lineWidth = n % 9 ? 1.5 : 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 70, y);
      ctx.lineTo(x + 120, y + 50);
      ctx.lineTo(x + 360 + (n % 90), y + 50);
      ctx.stroke();
      ctx.strokeStyle = '#65715a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.strokeStyle = '#758377';
  ctx.lineWidth = 2;
  ctx.font = '15px monospace';
  ctx.fillStyle = '#99a498';
  for (let i = 0; i < 48; i++) {
    const x = 40 + (i % 12) * 170,
      y = 82 + Math.floor(i / 12) * 250;
    ctx.strokeRect(x, y, 65, 35);
    ctx.fillText((i % 3 === 0 ? 'C' : 'R') + (100 + i), x, y - 8);
  }
  ctx.font = '20px monospace';
  ctx.fillText('GPU ANATOMY  /  GB202', 70, 976);
  ctx.fillText('ILLUSTRATIVE PCB · REV 02', 1530, 976);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Quiet laser markings for physical packages; architecture has its own diagram language. */
export function packageTexture(id: string) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = id === 'vrm' ? '#48494a' : '#202224';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 18000; i++) {
    const x = (i * 173) % 512,
      y = (i * 137 + Math.floor(i / 512) * 19) % 512;
    ctx.fillStyle = i % 2 ? '#ffffff05' : '#00000009';
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.fillStyle = '#a4a6a0';
  ctx.beginPath();
  ctx.arc(44, 44, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '30px monospace';
  ctx.fillText(
    id === 'gddr7' ? 'GDDR7' : id === 'vrm' ? 'R22' : 'DrMOS',
    52,
    190,
  );
  ctx.font = '19px monospace';
  ctx.fillText(
    id === 'gddr7' ? '2 GB · BGA' : id === 'vrm' ? 'INDUCTOR' : 'POWER STAGE',
    52,
    234,
  );
  ctx.fillText('ILLUSTRATIVE', 52, 278);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
