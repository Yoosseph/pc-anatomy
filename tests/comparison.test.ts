import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canComparePhysicalScale,
  comparisonCategories,
  comparisonItem,
  comparisonItems,
  comparisonPanePoint,
  comparisonRows,
  createComparisonState,
  filterComparisonItems,
  initialComparisonState,
  selectComparisonItem,
  setComparisonActiveSide,
  setComparisonExplode,
  setComparisonFraming,
  swapComparisonSides,
  validateComparisonCatalogue,
} from '../lib/comparison-state.ts';
import { levelIds, levels, systemRoot } from '../lib/levels.ts';
import { byId } from '../lib/manifest.ts';

await test('comparison discovers every explorable scale once, across all systems', () => {
  assert.deepEqual(
    comparisonItems.map((item) => item.level),
    levelIds,
  );
  assert.equal(
    new Set(comparisonItems.map((item) => item.level)).size,
    levelIds.length,
  );
  for (const item of comparisonItems) {
    assert.equal(item.system, systemRoot(item.level));
    assert.equal(item.kind, levels[item.level].kind);
    assert.equal(byId[levels[item.level].concept].open, item.level);
    assert.ok(
      comparisonCategories.some((category) => category.id === item.category),
    );
  }
  validateComparisonCatalogue();
});

await test('categories distinguish subsystems and retain deeper scales with their family', () => {
  const cases = {
    pc: 'systems',
    legion: 'systems',
    macbook: 'systems',
    motherboard: 'boards',
    macboard: 'boards',
    ryzenio: 'processors',
    legioncore: 'processors',
    maccore: 'processors',
    die: 'graphics',
    xve: 'graphics',
    macgpucore: 'graphics',
    cell: 'memory',
    legionpackage: 'memory',
    maccell: 'memory',
    psubronze: 'power',
    macbattery: 'power',
    legiondisplay: 'displays',
    macdisplay: 'displays',
  } as const;
  for (const [level, category] of Object.entries(cases))
    assert.equal(
      comparisonItem(level as keyof typeof cases).category,
      category,
    );
  assert.deepEqual(
    filterComparisonItems({ category: 'cooling' }).map((item) => item.level),
    ['fan', 'cooler', 'liquid', 'legioncooling', 'maccooling'],
  );
});

await test('catalogue filters combine category, system and all search words', () => {
  assert.equal(filterComparisonItems().length, levelIds.length);
  assert.equal(filterComparisonItems({ query: '   ' }).length, levelIds.length);
  assert.deepEqual(
    filterComparisonItems({ category: 'displays', system: 'macbook' }).map(
      (item) => item.level,
    ),
    ['macdisplay'],
  );
  assert.deepEqual(
    filterComparisonItems({
      category: 'memory',
      system: 'legion',
      query: '  DDR4  8 GB 260-pin ',
    }).map((item) => item.level),
    ['legionmemory'],
  );
  assert.ok(
    filterComparisonItems({ query: 'macbook memory cell' }).some(
      (item) => item.level === 'maccell',
    ),
  );
  assert.ok(
    filterComparisonItems({ query: 'rtx 5090 tensor' }).some(
      (item) => item.level === 'sm',
    ),
  );
  assert.deepEqual(
    filterComparisonItems({ category: 'cooling', query: 'unavailable model' }),
    [],
  );
});

await test('entry starts from the current scale with a distinct companion', () => {
  assert.equal(initialComparisonState.left, 'card');
  assert.equal(initialComparisonState.right, 'rx9070');
  assert.equal(initialComparisonState.framing, 'fit');
  for (const level of levelIds) {
    const state = createComparisonState(level);
    assert.equal(state.left, level);
    assert.notEqual(state.right, level);
    assert.equal(
      comparisonItem(state.right).category,
      comparisonItem(level).category,
    );
  }
  assert.equal(createComparisonState('macbook').right, 'pc');
  assert.equal(
    comparisonItem(createComparisonState('macgpu').right).system,
    'pc',
  );
});

await test('every distinct cross-category and cross-system pair can be selected', () => {
  for (const left of levelIds)
    for (const right of levelIds) {
      if (left === right) continue;
      const state = createComparisonState(left);
      const selected = selectComparisonItem(state, 'right', right);
      assert.equal(selected.left, left);
      assert.equal(selected.right, right);
      assert.equal(selectComparisonItem(selected, 'left', right), selected);
      assert.equal(selectComparisonItem(selected, 'right', left), selected);
    }
  const state = { ...initialComparisonState, specsOpen: true, explode: 42 };
  const both = selectComparisonItem(
    selectComparisonItem(state, 'left', 'maccell'),
    'right',
    'fan',
  );
  assert.deepEqual(both, { ...state, left: 'maccell', right: 'fan' });
  assert.deepEqual(swapComparisonSides(both), {
    ...both,
    left: 'fan',
    right: 'maccell',
  });
  assert.deepEqual(setComparisonActiveSide(both, 'right'), {
    ...both,
    activeSide: 'right',
  });
  assert.equal(setComparisonExplode(both, 140).explode, 100);
  assert.equal(setComparisonExplode(both, -20).explode, 0);
});

await test('true-size framing only accepts uniform physical scales and resets for diagrams', () => {
  assert.equal(comparisonItem('pc').millimetersPerUnit, 35);
  assert.equal(comparisonItem('card').millimetersPerUnit, 348 / 8.93);
  assert.equal(comparisonItem('legionmemory').millimetersPerUnit, 20);
  assert.equal(comparisonItem('dimm').millimetersPerUnit, 6);
  for (const level of ['dram', 'ddr4dram', 'macmemory', 'die'] as const)
    assert.equal(comparisonItem(level).millimetersPerUnit, null);
  assert.ok(canComparePhysicalScale('legionmemory', 'dimm'));
  assert.equal(canComparePhysicalScale('dram', 'legionpackage'), false);
  const scaled = setComparisonFraming(initialComparisonState, 'scale');
  assert.equal(scaled.framing, 'scale');
  const physical = selectComparisonItem(scaled, 'left', 'macbook');
  assert.equal(physical.framing, 'scale');
  const logical = selectComparisonItem(physical, 'left', 'macgpu');
  assert.equal(logical.framing, 'fit');
  assert.equal(setComparisonFraming(logical, 'scale'), logical);
});

await test('specifications only describe the selected model, with no child-field fallback', () => {
  for (const item of comparisonItems) {
    const ownSpecs = byId[levels[item.level].concept].specifications;
    assert.deepEqual(
      Object.fromEntries(item.specs.map((spec) => [spec.label, spec.value])),
      ownSpecs,
    );
  }
  assert.deepEqual(comparisonItem('macboard').specs, []);
  assert.equal(
    comparisonItem('psu').specs.some((spec) => spec.label === 'Diameter'),
    false,
  );
  assert.equal(
    comparisonItem('legioncpu').specs.some(
      (spec) => spec.label === 'Architecture',
    ),
    false,
  );
});

await test('specification rows match meaning by label and preserve missing values', () => {
  const storage = comparisonRows('ssd', 'nvme');
  assert.deepEqual(
    storage.find((row) => row.label === 'Dimensions'),
    {
      id: 'storage:dimensions',
      label: 'Dimensions',
      left: '100 × 69.85 × 7 mm',
      right: '80 × 22 mm',
    },
  );
  const gpu = comparisonRows('card', 'arcb580');
  assert.equal(gpu.find((row) => row.label === 'Weight')?.left, null);
  assert.equal(gpu.find((row) => row.label === 'Weight')?.right, '779 g');
  assert.equal(gpu.find((row) => row.label === 'Graphics power')?.right, null);
  const unrelated = comparisonRows('maccpu', 'macgpu').filter(
    (row) => row.label === 'Cores',
  );
  assert.equal(unrelated.length, 2);
  assert.ok(unrelated.every((row) => row.left === null || row.right === null));
  assert.deepEqual(comparisonRows('legionboard', 'macboard'), []);
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
