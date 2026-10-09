// Browser smoke test: loads index.html in Chromium, edits a law by tapping and
// dragging, solves the first puzzle with the keyboard, and saves screenshots.
//   node test/e2e.mjs [screenshot-dir]
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch (e) { playwright = require('/opt/node22/lib/node_modules/playwright'); }

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || join(root, 'test', 'shots');
mkdirSync(out, { recursive: true });
const url = pathToFileURL(join(root, 'index.html')).href;

let failures = 0;
const ok = (cond, msg) => {
  console.log((cond ? '  ok   ' : '  FAIL ') + msg);
  if (!cond) failures++;
};

const browser = await playwright.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(m.text()); });
await page.goto(url);
await page.waitForTimeout(1500);
await page.screenshot({ path: join(out, 'sandbox.png') });

const lawCount = () => page.$$eval('#board .row.active', (r) => r.length);
const before = await lawCount();
ok(before === 12, 'sandbox starts with 12 laws in force (' + before + ')');

// Tap HEAVY in "SAND IS HEAVY" to remove it.
const heavy = page.locator('#board .row').first().locator('.tile', { hasText: 'HEAVY' });
await heavy.click();
ok((await lawCount()) === before - 1, 'tapping HEAVY breaks SAND IS HEAVY');

// Drag FLOATY from the palette onto the end of that row.
const floaty = page.locator('#palette .tile', { hasText: 'FLOATY' });
const row = page.locator('#board .row').first();
const fb = await floaty.boundingBox();
const rb = await row.boundingBox();
await page.mouse.move(fb.x + fb.width / 2, fb.y + fb.height / 2);
await page.mouse.down();
await page.mouse.move(fb.x + 30, fb.y - 30, { steps: 5 });
await page.mouse.move(rb.x + rb.width - 20, rb.y + rb.height / 2, { steps: 10 });
await page.mouse.up();
const firstRow = await row.innerText();
ok(/SAND\s+IS\s+FLOATY/.test(firstRow), 'dragging FLOATY makes SAND IS FLOATY (' + firstRow.replace(/\s+/g, ' ') + ')');
ok((await lawCount()) === before, 'the rewritten law is in force');
await page.waitForTimeout(1500);
await page.screenshot({ path: join(out, 'sand-floats.png') });

// Undo twice restores the original law.
await page.keyboard.press('Control+z');
await page.keyboard.press('Control+z');
ok(/SAND\s+IS\s+HEAVY/.test(await page.locator('#board .row').first().innerText()), 'undo restores SAND IS HEAVY');

// Recipe chip.
await page.locator('.chip', { hasText: 'Powder keg' }).click();
await page.waitForTimeout(300);
ok((await lawCount()) === before + 2, 'recipe adds two laws');

// Paint fire next to the oil lake to trigger explosions.
const canvas = page.locator('#world');
const cb = await canvas.boundingBox();
await page.locator('.brush', { hasText: 'FIRE' }).click();
await page.mouse.move(cb.x + cb.width * 0.3, cb.y + cb.height * 0.72);
await page.mouse.down();
await page.mouse.move(cb.x + cb.width * 0.4, cb.y + cb.height * 0.72, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(900);
await page.screenshot({ path: join(out, 'powder-keg.png') });

// Share code round trip.
await page.locator('#btn-share').click();
const code = await page.locator('#share-code').inputValue();
ok(/^r_[A-Za-z0-9-]+$/.test(code), 'share code looks right (' + code.slice(0, 24) + '...)');
await page.keyboard.press('Escape');

// Puzzles: level 1 is solved by holding right.
await page.locator('#tab-puzzles').click();
await page.evaluate(() => window.__sandtax.loadLevel(0));
await page.waitForTimeout(300);
await page.screenshot({ path: join(out, 'level-1.png') });
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(7000);
await page.keyboard.up('ArrowRight');
ok(await page.locator('#win').isVisible(), 'holding right wins level 1');
await page.screenshot({ path: join(out, 'level-1-win.png') });

// Level 2 via the UI: drop NOT between IS and HEAVY.
await page.locator('#btn-next').click();
await page.waitForTimeout(300);
const not = page.locator('#palette .tile', { hasText: 'NOT' });
const heavyTile = page.locator('#board .row', { hasText: 'HEAVY' }).locator('.tile', { hasText: 'HEAVY' });
const nb = await not.boundingBox();
const hb = await heavyTile.boundingBox();
await page.mouse.move(nb.x + nb.width / 2, nb.y + nb.height / 2);
await page.mouse.down();
await page.mouse.move(nb.x + 20, nb.y - 20, { steps: 4 });
await page.mouse.move(hb.x + 4, hb.y + hb.height / 2, { steps: 10 });
await page.mouse.up();
const r2 = await page.locator('#board .row', { hasText: 'HEAVY' }).innerText();
ok(/SAND\s+IS\s+NOT\s+HEAVY/.test(r2), 'NOT slips between locked words (' + r2.replace(/\s+/g, ' ') + ')');
await page.keyboard.down('ArrowUp');
await page.waitForTimeout(1600);
await page.keyboard.up('ArrowUp');
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(4500);
await page.keyboard.up('ArrowRight');
ok(await page.locator('#win').isVisible(), 'level 2 solved through the UI');

// Kaboom level for a screenshot mid-explosion.
await page.evaluate(() => window.__sandtax.loadLevel(7));
await page.locator('#palette .tile', { hasText: 'OIL' }).click();
await page.locator('#palette .tile', { hasText: 'IS' }).click();
await page.locator('#palette .tile', { hasText: 'BOOM' }).click();
await page.waitForTimeout(250);
await page.screenshot({ path: join(out, 'kaboom.png') });

// Mobile layout.
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
m.on('pageerror', (e) => errors.push('mobile: ' + e.message));
await m.goto(url);
await m.waitForTimeout(1200);
const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok(overflow <= 0, 'no horizontal scroll at phone width (' + overflow + 'px)');
await m.screenshot({ path: join(out, 'mobile.png'), fullPage: true });

ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
await browser.close();
console.log(failures ? failures + ' failure(s)' : 'all passed');
process.exit(failures ? 1 : 0);
