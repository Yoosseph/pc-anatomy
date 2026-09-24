import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isAccelerated,
  isSoftwareRenderer,
} from '../lib/graphics-acceleration.ts';

test('software rasterisers are recognised', () => {
  for (const name of [
    'Google SwiftShader',
    'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)',
    'llvmpipe (LLVM 15.0.7, 256 bits)',
    'ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0)',
    'GDI Generic',
    'Apple Software Renderer',
  ])
    assert.equal(isSoftwareRenderer(name), true, name);
});

test('real GPUs are not mistaken for software', () => {
  for (const name of [
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon RX 7800 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (Intel, Intel(R) UHD Graphics 770 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'Apple M2',
    'Mali-G78',
  ])
    assert.equal(isSoftwareRenderer(name), false, name);
});

test('acceleration counts as on only when every signal agrees', () => {
  const gpu = 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11)';
  assert.equal(
    isAccelerated({ webgl: true, performant: true, renderer: gpu }),
    true,
  );
  // Firefox and Safari may hide the renderer: trust the performance probe.
  assert.equal(isAccelerated({ webgl: true, performant: true }), true);
  // Anything doubtful reports acceleration as off.
  assert.equal(
    isAccelerated({ webgl: true, performant: false, renderer: gpu }),
    false,
  );
  assert.equal(
    isAccelerated({
      webgl: true,
      performant: true,
      renderer: 'Google SwiftShader',
    }),
    false,
  );
  assert.equal(isAccelerated({ webgl: false, performant: false }), false);
});
