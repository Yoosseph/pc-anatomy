import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  comparisonGroupIds,
  comparisonGroups,
  comparisonItem,
  comparisonLevels,
  comparisonPanePoint,
  initialComparisonState,
  selectComparisonGroup,
  selectComparisonItem,
  setComparisonActiveSide,
  setComparisonExplode,
  swapComparisonSides,
  type ComparisonLevel,
  validateComparisonCatalogue,
} from '../lib/comparison-state.ts';
import { levels } from '../lib/levels.ts';
import { byId } from '../lib/manifest.ts';
import { buildModel } from '../lib/models.ts';
import {
  commonModelBounds,
  disposeModelResources,
  posedModelBounds,
  prepareModelInventory,
} from '../lib/model-stage.ts';

const previousDocument = globalThis.document;
globalThis.document = {
  createElement: () => ({
    width: 0,
    height: 0,
    getContext: () =>
      new Proxy(
        {},
        {
          get: (_, key) =>
            key === 'createImageData'
              ? (width: number, height: number) => ({
                  data: new Uint8ClampedArray(width * height * 4),
                })
              : () => {},
        },
      ),
  }),
} as unknown as Document;
const allComparisonLevels = comparisonGroupIds.flatMap(comparisonLevels);
const comparisonModels = Object.fromEntries(
  allComparisonLevels.map((level) => [level, buildModel(level)]),
) as Record<ComparisonLevel, ReturnType<typeof buildModel>>;
const specValue = (
  group: Parameters<typeof comparisonItem>[0],
  level: ComparisonLevel,
  id: string,
) => comparisonItem(group, level).specs.find((row) => row.id === id)?.value;
const modelSize = (level: ComparisonLevel) =>
  posedModelBounds(comparisonModels[level], level, 0).getSize(new T.Vector3());
after(() => {
  Object.values(comparisonModels).forEach(disposeModelResources);
  globalThis.document = previousDocument;
});

await test('comparison state starts with a distinct valid pair', () => {
  assert.equal(initialComparisonState.left, 'card');
  assert.equal(initialComparisonState.right, 'rx9070');
  assert.equal(initialComparisonState.group, 'gpu');
  assert.notEqual(initialComparisonState.left, initialComparisonState.right);
  validateComparisonCatalogue();
});

await test('comparison models and catalogue roots are discovered from canonical data', () => {
  assert.deepEqual(comparisonLevels('gpu'), ['card', 'rx9070', 'arcb580']);
  assert.deepEqual(comparisonLevels('psu'), ['psu', 'psubronze']);
  assert.deepEqual(comparisonLevels('cpu'), ['ryzen', 'corei9']);
  assert.deepEqual(comparisonLevels('storage'), ['ssd', 'nvme']);
  for (const group of comparisonGroupIds)
    for (const level of comparisonLevels(group)) {
      assert.equal(levels[level].comparisonGroup, group);
      assert.equal(byId[levels[level].concept].open, level);
    }
});

await test('comparison transitions preserve unrelated state', () => {
  const open = { ...initialComparisonState, specsOpen: true, explode: 42 };
  const selected = selectComparisonItem(open, 'right', 'arcb580');
  assert.deepEqual(selected, { ...open, right: 'arcb580' });
  assert.equal(selectComparisonItem(selected, 'left', 'arcb580'), selected);
  assert.equal(selectComparisonItem(selected, 'left', 'psu'), selected);
  assert.deepEqual(swapComparisonSides(selected), {
    ...selected,
    left: 'arcb580',
    right: 'card',
  });
  assert.deepEqual(setComparisonActiveSide(open, 'right'), {
    ...open,
    activeSide: 'right',
  });
  assert.deepEqual(setComparisonExplode(open, 140), {
    ...open,
    explode: 100,
  });
  assert.deepEqual(selectComparisonGroup(open, 'psu'), {
    ...open,
    group: 'psu',
    left: 'psu',
    right: 'psubronze',
    activeSide: 'left',
    explode: 0,
    specsOpen: false,
  });
});

await test('every comparison group resolves complete catalogue-backed specs', () => {
  for (const group of comparisonGroupIds)
    for (const level of comparisonLevels(group)) {
      const item = comparisonItem(group, level);
      assert.equal(item.level, level);
      assert.equal(item.specs.length, comparisonGroups[group].rows.length);
      assert.ok(item.specs.every((row) => row.value.trim().length > 0));
    }
  const cases = [
    ['gpu', 'card', 'boardPower', '575 W'],
    ['gpu', 'card', 'interface', 'PCI Express 5.0'],
    ['psu', 'psu', 'output', '850 W'],
    ['cpu', 'corei9', 'socket', 'LGA 1851'],
    ['gpu', 'arcb580', 'exterior', 'Intel Arc B580 Limited Edition'],
    ['storage', 'ssd', 'interface', 'SATA 6 Gb/s'],
    ['storage', 'nvme', 'dimensions', '80 × 22 mm'],
  ] as const;
  for (const [group, level, id, expected] of cases)
    assert.equal(specValue(group, level, id), expected);
});

await test('pane coordinates map split and mobile viewports independently', () => {
  const rect = { left: 100, top: 50, width: 1000, height: 500 };
  const cases = [
    [100, 50, true, 'left', { side: 'left', x: -1, y: 1 }],
    [600, 300, true, 'left', { side: 'right', x: -1, y: 0 }],
    [1100, 550, true, 'left', { side: 'right', x: 1, y: -1 }],
    [600, 300, false, 'right', { side: 'right', x: 0, y: 0 }],
  ] as const;
  for (const [x, y, split, side, expected] of cases)
    assert.deepEqual(comparisonPanePoint(x, y, rect, split, side), expected);
});

await test('common camera bounds contain every configured pair', () => {
  for (const group of comparisonGroupIds)
    for (const amount of [0, 0.5, 1]) {
      const levels = comparisonLevels(group);
      const boxes = levels.map((level) => {
        const model = comparisonModels[level];
        model.pieces.forEach((piece) => {
          piece.visible = piece.reveal === 0 || amount > piece.reveal;
        });
        prepareModelInventory(
          model,
          level,
          1,
          model.pieces.filter((piece) => piece.visible),
        );
        return posedModelBounds(model, level, amount);
      });
      for (let left = 0; left < boxes.length; left++)
        for (let right = left + 1; right < boxes.length; right++) {
          const common = commonModelBounds(boxes[left], boxes[right]);
          for (const box of [boxes[left], boxes[right]])
            assert.ok(
              [box.min, box.max].every((point) => common.containsPoint(point)),
              `${group} bounds escaped at ${amount}`,
            );
        }
    }
  const rtx = modelSize('card'),
    arc = modelSize('arcb580');
  assert.ok(rtx.x > arc.x, 'the RTX 5090 must remain longer than the Arc B580');
  const sata = modelSize('ssd'),
    nvme = modelSize('nvme');
  assert.ok(
    sata.x > nvme.x * 1.15,
    'the 100 mm SATA drive must remain longer than the 80 mm NVMe module',
  );
});
