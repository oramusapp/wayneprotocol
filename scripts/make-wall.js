/* Generuje sciana.png (A4, 1588 × 2246 px = 794 × 1123 przy 2×) z wall.html.
   Uruchom z katalogu repozytorium: node scripts/make-wall.js  (wymaga Playwright i Chromium).
   Po zmianie zasad lub przysięgi w assets/code-data.js uruchom ponownie i zatwierdź nowy sciana.png. */
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const root = path.resolve(__dirname, '..');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
  await p.goto('file://' + path.join(root, 'wall.html'));
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  if (h > 1123) { console.error('Ściana nie mieści się na A4: ' + h + ' px > 1123 px'); process.exitCode = 1; }
  await p.screenshot({ path: path.join(root, 'sciana.png'), clip: { x: 0, y: 0, width: 794, height: 1123 } });
  await b.close();
  console.log('sciana.png gotowe (' + h + ' px wysokości treści)');
})();
