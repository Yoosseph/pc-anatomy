import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  comparisonCard,
  comparisonPanePoint,
  gpuComparisonLevels,
  initialComparisonState,
  selectComparisonGpu,
  setComparisonActiveSide,
  setComparisonExplode,
  swapComparisonSides,
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
const comparisonModels = Object.fromEntries(
  gpuComparisonLevels.map((level) => [level, buildModel(level)]),
) as Record<
  (typeof gpuComparisonLevels)[number],
  ReturnType<typeof buildModel>
>;
after(() => {
  Object.values(comparisonModels).forEach(disposeModelResources);
  globalThis.document = previousDocument;
});

await test('comparison state starts with a distinct valid pair', () => {
  assert.equal(initialComparisonState.left, 'card');
  assert.equal(initialComparisonState.right, 'rx9070');
  assert.notEqual(initialComparisonState.left, initialComparisonState.right);
  validateComparisonCatalogue();
});

await test('comparison transitions preserve unrelated state', () => {
  const open = { ...initialComparisonState, specsOpen: true, explode: 42 };
  const selected = selectComparisonGpu(open, 'right', 'arcb580');
  assert.deepEqual(selected, { ...open, right: 'arcb580' });
  assert.equal(selectComparisonGpu(selected, 'left', 'arcb580'), selected);
  assert.deepEqual(swapComparisonSides(selected), {
    ...selected,
    left: 'arcb580',
    right: 'card',
  });
  assert.deepEqual(setComparisonActiveSide(open, 'right'), {
    ...open,
    activeSide: 'right',
  });
  assert.deepEqual(setComparisonExplode({ ...open, playing: true }, 140), {
    ...open,
    explode: 100,
    playing: false,
  });
});

await test('all three cards resolve the complete catalogue-backed spec sheet', () => {
  for (const level of gpuComparisonLevels) {
    const card = comparisonCard(level);
    assert.equal(card.level, level);
    assert.equal(card.specs.length, 7);
    assert.ok(card.specs.every((row) => row.value.trim().length > 0));
  }
  assert.equal(
    comparisonCard('card').specs.find((row) => row.id === 'boardPower')?.value,
    '575 W',
  );
  assert.equal(
    comparisonCard('card').specs.find((row) => row.id === 'interface')?.value,
    'PCI Express 5.0',
  );
  assert.equal(
    comparisonCard('arcb580').specs.find((row) => row.id === 'exterior')?.value,
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

await test('common camera bounds contain both posed cards throughout disassembly', () => {
  for (const amount of [0, 0.5, 1]) {
    const boxes = gpuComparisonLevels.map((level) => {
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
            `minimum escaped at ${amount}`,
          );
          assert.ok(
            common.containsPoint(box.max),
            `maximum escaped at ${amount}`,
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
