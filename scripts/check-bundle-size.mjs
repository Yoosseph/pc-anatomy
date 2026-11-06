import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { eagerScripts } from './bundle-size.ts';

/**
 * Keeps the 3D engine out of the first download.
 *
 * The interface is meant to paint before three.js arrives (see "Loading" in
 * ARCHITECTURE.md). That holds only while nothing the entry imports reaches
 * a module that imports three, and one stray `import` from a builder file is
 * enough to drag the whole engine back in without any error. This runs after
 * `vite build` and fails if eager scripts carry three.js or grow past
 * its budget. Raise the budget deliberately, in the same commit as the reason.
 */

const BUDGET_KB = 220; // total gzipped eager JavaScript
const ENGINE_MARKERS = ['WebGLRenderer', 'BufferGeometry', 'mergeGeometries'];

const dist = path.resolve(import.meta.dirname, '../dist');
const manifest = JSON.parse(
  fs.readFileSync(path.join(dist, '.vite/manifest.json'), 'utf8'),
);
const scripts = eagerScripts(manifest).map((file) => ({
  file,
  code: fs.readFileSync(path.join(dist, file)),
}));
const gzipKb =
  scripts.reduce((size, { code }) => size + gzipSync(code).length, 0) / 1024;
const leaked = scripts.flatMap(({ file, code }) =>
  ENGINE_MARKERS.filter((marker) => code.includes(marker)).map(
    (marker) => `${marker} in ${file}`,
  ),
);
const failures = [];

if (leaked.length)
  failures.push(
    `three.js is in the initial download (found ${leaked.join(', ')}). Something the interface imports eagerly imports three; move what it needs into a module that does not.`,
  );
if (gzipKb > BUDGET_KB)
  failures.push(
    `eager scripts total ${gzipKb.toFixed(1)} KB gzipped, over the ${BUDGET_KB} KB budget.`,
  );

console.log(
  `Bundle check: ${scripts.length} eager scripts total ${gzipKb.toFixed(1)} KB gzipped (budget ${BUDGET_KB} KB).`,
);
for (const failure of failures)
  console.error(`Bundle check failed: ${failure}`);
process.exit(failures.length ? 1 : 0);
