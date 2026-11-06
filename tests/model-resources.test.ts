import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { disposeModelResources } from '../lib/model-stage.ts';
import { buildPowerFlow } from '../lib/power-flow.ts';
import { markShared } from '../lib/geometry-cache.ts';

await test('disposing power flow releases lines and instance buffers as well as meshes', () => {
  const path: [number, number, number][] = [
    [0, 0, 0],
    [1, 1, 1],
  ];
  const root = buildPowerFlow({ atx: path, eps: path, gpu: path, slot: path });
  const resources = new Set<T.BufferGeometry | T.Material | T.InstancedMesh>();
  root.traverse((object) => {
    if (!(object instanceof T.Mesh || object instanceof T.Line)) return;
    resources.add(object.geometry);
    for (const material of [object.material].flat()) resources.add(material);
    if (object instanceof T.InstancedMesh) resources.add(object);
  });
  const disposed = new Map<object, number>();
  for (const resource of resources) {
    const onDispose = () => {
      disposed.set(resource, (disposed.get(resource) ?? 0) + 1);
    };
    if (resource instanceof T.InstancedMesh)
      resource.addEventListener('dispose', onDispose);
    else if (resource instanceof T.BufferGeometry)
      resource.addEventListener('dispose', onDispose);
    else resource.addEventListener('dispose', onDispose);
  }

  disposeModelResources({ root, pieces: [] });

  for (const resource of resources)
    assert.equal(
      disposed.get(resource),
      1,
      `${resource.type} must be released once`,
    );
});

await test('model disposal releases owned textures once and preserves shared resources', () => {
  const root = new T.Group();
  const geometry = markShared(new T.BoxGeometry());
  const sharedTexture = markShared(new T.Texture());
  const ownedTexture = new T.Texture();
  const material = new T.MeshStandardMaterial({
    map: ownedTexture,
    bumpMap: ownedTexture,
    roughnessMap: sharedTexture,
  });
  root.add(new T.Mesh(geometry, material), new T.Mesh(geometry, material));
  let ownedDisposals = 0;
  ownedTexture.addEventListener('dispose', () => ownedDisposals++);
  geometry.addEventListener('dispose', () =>
    assert.fail('shared geometry disposed'),
  );
  sharedTexture.addEventListener('dispose', () =>
    assert.fail('shared texture disposed'),
  );

  disposeModelResources({ root, pieces: [] });

  assert.equal(ownedDisposals, 1);
});
