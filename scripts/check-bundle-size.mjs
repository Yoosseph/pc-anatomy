import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

/**
 * Keeps the 3D engine out of the first download.
 *
 * The interface is meant to paint before three.js arrives (see "Loading" in
 * ARCHITECTURE.md). That holds only while nothing the entry imports reaches
 * a module that imports three, and one stray `import` from a builder file is
 * enough to drag the whole engine back in without any error. This runs after
 * `vite build` and fails if the entry chunk carries three.js or grows past
 * its budget. Raise the budget deliberately, in the same commit as the reason.
 */

const BUDGET_KB = 220; // gzipped entry chunk; about 185 KB when this was set
const ENGINE_MARKERS = ['WebGLRenderer', 'BufferGeometry', 'mergeGeometries'];

const dist = path.resolve(import.meta.dirname, '../dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const entry = html.match(
  /<script[^>]+type="module"[^>]+src="\/?([^"]+\.js)"/,
)?.[1];
if (!entry) {
  console.error(
    'Bundle check: no module script found in dist/index.html. Run the build first.',
  );
  process.exit(1);
}

const code = fs.readFileSync(path.join(dist, entry));
const gzipKb = gzipSync(code).length / 1024;
const leaked = ENGINE_MARKERS.filter((marker) => code.includes(marker));
const failures = [];

if (leaked.length)
  failures.push(
    `three.js is in the entry chunk (found ${leaked.join(', ')}). Something the interface imports eagerly imports three; move what it needs into a module that does not.`,
  );
if (gzipKb > BUDGET_KB)
  failures.push(
    `entry chunk is ${gzipKb.toFixed(1)} KB gzipped, over the ${BUDGET_KB} KB budget.`,
  );

console.log(
  `Bundle check: ${entry} is ${gzipKb.toFixed(1)} KB gzipped (budget ${BUDGET_KB} KB).`,
);
for (const failure of failures)
  console.error(`Bundle check failed: ${failure}`);
process.exit(failures.length ? 1 : 0);
