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
  assert.equal(
    comparisonItem('gpu', 'card').specs.find((row) => row.id === 'boardPower')
      ?.value,
    '575 W',
  );
  assert.equal(
    comparisonItem('gpu', 'card').specs.find((row) => row.id === 'interface')
      ?.value,
    'PCI Express 5.0',
  );
  assert.equal(
    comparisonItem('psu', 'psu').specs.find((row) => row.id === 'output')
      ?.value,
    '850 W',
  );
  assert.equal(
    comparisonItem('cpu', 'corei9').specs.find((row) => row.id === 'socket')
      ?.value,
    'LGA 1851',
  );
  assert.equal(
    comparisonItem('gpu', 'arcb580').specs.find((row) => row.id === 'exterior')
      ?.value,
    'Intel Arc B580 Limited Edition',
  );
});

await test('pane coordinates map split and mobile viewports independently', () => {
  const rect = { left: 100, top: 50, width: 1000, height: 500 };
  assert.deepEqual(comparisonPanePoint(100, 50, rect, true, 'left'), {
    side: 'left',
    x: -1,
    y: 1,
  });
  assert.deepEqual(comparisonPanePoint(600, 300, rect, true, 'left'), {
    side: 'right',
    x: -1,
    y: 0,
  });
  assert.deepEqual(comparisonPanePoint(1100, 550, rect, true, 'left'), {
    side: 'right',
    x: 1,
    y: -1,
  });
  assert.deepEqual(comparisonPanePoint(600, 300, rect, false, 'right'), {
    side: 'right',
    x: 0,
    y: 0,
  });
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
          for (const box of [boxes[left], boxes[right]]) {
            assert.ok(
              common.containsPoint(box.min),
              `${group} minimum escaped at ${amount}`,
            );
            assert.ok(
              common.containsPoint(box.max),
              `${group} maximum escaped at ${amount}`,
            );
          }
        }
    }
  const rtx = posedModelBounds(comparisonModels.card, 'card', 0).getSize(
    new T.Vector3(),
  );
  const arc = posedModelBounds(comparisonModels.arcb580, 'arcb580', 0).getSize(
    new T.Vector3(),
  );
  assert.ok(rtx.x > arc.x, 'the RTX 5090 must remain longer than the Arc B580');
});
