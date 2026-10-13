import fs from 'node:fs';
import { sitemapUrls } from './sitemap-urls.ts';

// Run with Node's --experimental-strip-types after adding scales or parts.
// tests/discovery.test.ts fails when the committed sitemap falls behind.
const escape = (url) => url.replaceAll('&', '&amp;');
fs.writeFileSync(
  new URL('../public/sitemap.xml', import.meta.url),
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapUrls().map((url) => `  <url><loc>${escape(url)}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n'),
);
