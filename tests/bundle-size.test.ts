import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eagerScripts } from '../scripts/bundle-size.ts';

await test('the initial-download budget includes transitive shared chunks but excludes lazy viewers', () => {
  assert.deepEqual(
    eagerScripts({
      'index.html': {
        file: 'assets/index.js',
        isEntry: true,
        imports: ['catalogue', 'react'],
        dynamicImports: ['viewer'],
      },
      catalogue: { file: 'assets/catalogue.js', imports: ['react'] },
      react: { file: 'assets/react.js' },
      viewer: { file: 'assets/viewer.js', imports: ['three'] },
      three: { file: 'assets/three.js' },
    }).sort(),
    ['assets/catalogue.js', 'assets/index.js', 'assets/react.js'],
  );
});

await test('eager engine imports cannot hide in shared or cyclic chunks', () => {
  assert.deepEqual(
    eagerScripts({
      'index.html': {
        file: 'assets/index.js',
        isEntry: true,
        imports: ['shared'],
      },
      shared: { file: 'assets/shared.js', imports: ['index.html', 'three'] },
      three: { file: 'assets/three.js' },
    }).sort(),
    ['assets/index.js', 'assets/shared.js', 'assets/three.js'],
  );
  assert.throws(() => eagerScripts({}), /no entry/);
  assert.throws(
    () =>
      eagerScripts({
        'index.html': { file: 'index.js', isEntry: true, imports: ['missing'] },
      }),
    /missing imported chunk/,
  );
});
