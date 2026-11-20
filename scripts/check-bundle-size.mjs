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
 * `vite build` and fails if the first download carries three.js or grows past
 * its budget. Raise the budget deliberately, in the same commit as the reason.
 *
 * The first download is the entry chunk plus every chunk `index.html`
 * preloads beside it: the bundler may split the entry's static imports into
 * several files (a top-level await does), and they all arrive before the
 * interface can paint.
 */

const BUDGET_KB = 220; // gzipped first download; about 185 KB when this was set
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

const preloaded = [
  ...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="\/?([^"]+\.js)"/g),
].map((match) => match[1]);
const code = Buffer.concat(
  [entry, ...preloaded].map((file) => fs.readFileSync(path.join(dist, file))),
);
const gzipKb = gzipSync(code).length / 1024;
const leaked = ENGINE_MARKERS.filter((marker) => code.includes(marker));
const failures = [];

if (leaked.length)
  failures.push(
    `three.js is in the first download (found ${leaked.join(', ')}). Something the interface imports eagerly imports three; move what it needs into a module that does not.`,
  );
if (gzipKb > BUDGET_KB)
  failures.push(
    `the first download is ${gzipKb.toFixed(1)} KB gzipped, over the ${BUDGET_KB} KB budget.`,
  );

console.log(
  `Bundle check: ${entry} and ${preloaded.length} preloaded chunks are ${gzipKb.toFixed(1)} KB gzipped (budget ${BUDGET_KB} KB).`,
);
for (const failure of failures)
  console.error(`Bundle check failed: ${failure}`);
process.exit(failures.length ? 1 : 0);
