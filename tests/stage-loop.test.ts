import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createStageLoop,
  animateObjects,
  collectAnimatedObjects,
} from '../lib/stage-runtime.ts';
import * as T from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

await test('hidden and collapsed animated assemblies let the stage sleep and resume correctly', () => {
  const root = new T.Group(),
    rotor = new T.Group();
  rotor.userData.spinRate = 3;
  root.add(rotor);
  const objects = collectAnimatedObjects(root);
  assert.equal(animateObjects(objects, 1), true);
  assert.equal(rotor.rotation.y, 3);
  root.visible = false;
  assert.equal(animateObjects(objects, 2), false);
  assert.equal(rotor.rotation.y, 3);
  root.visible = true;
  root.scale.setScalar(0);
  assert.equal(animateObjects(objects, 3), false);
  root.scale.setScalar(1);
  assert.equal(animateObjects(objects, 4), true);
  assert.equal(rotor.rotation.y, 12);
});

await test('stage loop sleeps promptly, continues moving frames, and cancels on disposal', () => {
  const previous = {
    request: globalThis.requestAnimationFrame,
    cancel: globalThis.cancelAnimationFrame,
    media: globalThis.matchMedia,
  };
  const queued = new Map<number, FrameRequestCallback>();
  const listeners = new Map<string, () => void>();
  let id = 0,
    draws = 0,
    moving = false;
  globalThis.requestAnimationFrame = (callback) => {
    queued.set(++id, callback);
    return id;
  };
  globalThis.cancelAnimationFrame = (key) => {
    queued.delete(key);
  };
  globalThis.matchMedia = (() => ({
    matches: false,
  })) as unknown as typeof matchMedia;
  const controls = {
    addEventListener: (name: string, callback: () => void) =>
      listeners.set(name, callback),
    removeEventListener: (name: string) => listeners.delete(name),
  } as unknown as OrbitControls;
  const loop = createStageLoop(
    controls,
    () => {},
    () => {
      draws++;
      return moving;
    },
  );
  const frame = () => {
    const [key, callback] = queued.entries().next().value!;
    queued.delete(key);
    callback(performance.now() + 16);
  };
  try {
    loop.wake();
    loop.wake();
    assert.equal(
      queued.size,
      1,
      'repeated input must not create multiple loops',
    );
    while (queued.size) frame();
    assert.equal(
      draws,
      3,
      'stationary input should not leave 35-90 frames running',
    );
    moving = true;
    loop.wake();
    for (let i = 0; i < 10; i++) frame();
    assert.equal(
      queued.size,
      1,
      'animation must continue beyond the wake budget',
    );
    moving = false;
    frame();
    assert.equal(queued.size, 0);
    listeners.get('change')!();
    assert.equal(queued.size, 1, 'orbit damping must wake the next frame');
    loop.dispose();
    assert.equal(queued.size, 0);
    assert.equal(listeners.size, 0);
  } finally {
    loop.dispose();
    globalThis.requestAnimationFrame = previous.request;
    globalThis.cancelAnimationFrame = previous.cancel;
    globalThis.matchMedia = previous.media;
  }
});
