// Headless checks for the SANDTAX engine and every puzzle.
//   node test/run.mjs           run everything
//   node test/run.mjs hungry    only levels whose id contains "hungry"
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const S = require('../src/engine.js');
const L = require('../src/levels.js');

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log('  ok   ' + msg);
  else { failures++; console.log('  FAIL ' + msg); }
};

const DIRS = {
  wait: [0, 0], right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1],
  'up-right': [1, -1], 'up-left': [-1, -1],
};

function rowsToIds(rows) {
  return rows.map((r) => S.rowFromKeys(r));
}

function run(level, rows, script, seed) {
  const world = new S.World(seed);
  L.buildLevel(world, level);
  world.setRules(S.compileBoard(rowsToIds(rows)).rules);
  let t = 0;
  for (const [dir, n] of script) {
    const [dx, dy] = DIRS[dir];
    world.input.dx = dx;
    world.input.dy = dy;
    for (let k = 0; k < n; k++) {
      world.tick();
      t++;
      if (world.won) return { won: true, t };
    }
  }
  return { won: false, t };
}

// The solution may only add loose words: every locked row must survive as an
// in-order subsequence of one solution row, and the extra words must come
// from the level's word bank.
function usesOnlyGivenWords(level, solRows) {
  const pool = {};
  for (const r of level.rules) for (const w of r) pool[w] = (pool[w] || 0) + 1;
  for (const w of level.words) pool[w] = (pool[w] || 0) + 1;
  for (const r of solRows) for (const w of r) {
    if (!pool[w]) return 'word ' + w + ' is not available';
    pool[w]--;
  }
  const used = new Set();
  for (const locked of level.rules) {
    const idx = solRows.findIndex((r, i) => {
      if (used.has(i)) return false;
      let k = 0;
      for (const w of r) if (w === locked[k]) k++;
      return k === locked.length;
    });
    if (idx < 0) return 'locked row ' + locked.join(' ') + ' was broken';
    used.add(idx);
  }
  return null;
}

// ---------------------------------------------------------------- parser
console.log('parser');
const P = (s) => S.parseRow(S.rowFromKeys(s.split(' ')));
ok(P('SAND IS HEAVY'), 'SAND IS HEAVY parses');
ok(P('SAND AND WATER IS HOT AND FLOATY'), 'AND on both sides parses');
ok(P('SAND IS NOT HEAVY'), 'NOT before a property parses');
ok(P('FIRE EATS NOT STONE'), 'EATS NOT parses');
ok(!P('FIRE MAKES NOT STONE'), 'MAKES NOT is rejected');
ok(!P('SAND EATS HOT'), 'EATS with a property is rejected');
ok(!P('SAND IS'), 'incomplete sentence is rejected');
ok(!P('SAND IS HEAVY AND'), 'trailing AND is rejected');
ok(!P('IS SAND HEAVY'), 'verb first is rejected');
const rows = rowsToIds(L.DEFAULT_RULES);
ok(JSON.stringify(S.decodeRows(S.encodeRows(rows))) === JSON.stringify(rows), 'share code round-trips');

// ------------------------------------------------------------- semantics
console.log('semantics');
{
  const w = new S.World(7);
  const g = S.painter(w);
  g.rect(10, 10, 20, 20, S.MAT.SAND);
  g.rect(40, 10, 50, 20, S.MAT.WATER);
  w.setRules(S.compileBoard(rowsToIds([['SAND', 'IS', 'WATER'], ['WATER', 'IS', 'SAND']])).rules);
  const before = [w.count(S.MAT.SAND), w.count(S.MAT.WATER)];
  w.tick();
  const after1 = [w.count(S.MAT.SAND), w.count(S.MAT.WATER)];
  w.tick();
  const after2 = [w.count(S.MAT.SAND), w.count(S.MAT.WATER)];
  ok(after1[0] === before[1] && after1[1] === before[0], 'a transform cycle swaps once');
  ok(after2[0] === after1[0], 'a transform cycle does not strobe');
}
{
  const w = new S.World(3);
  S.painter(w).rect(0, 100, 191, 119, S.MAT.STONE);
  S.painter(w).rect(20, 0, 30, 10, S.MAT.SAND);
  w.setRules(S.compileBoard(rowsToIds([['SAND', 'IS', 'HEAVY']])).rules);
  for (let i = 0; i < 200; i++) w.tick();
  let lowest = 0;
  for (let i = 0; i < S.N; i++) if (w.mat[i] === S.MAT.SAND) lowest = Math.max(lowest, (i / S.W) | 0);
  ok(lowest === 99, 'HEAVY sand lands on the floor');
}

// ---------------------------------------------------------------- levels
const filter = process.argv[2] || '';
const baselines = [['right', 900], ['left', 300], ['up-right', 600], ['up', 300], ['wait', 600], ['right', 600]];
for (const level of L.LEVELS) {
  if (filter && !level.id.includes(filter)) continue;
  console.log('level ' + level.id);
  const solRows = level.solution.rows || level.rules;
  const err = usesOnlyGivenWords(level, solRows);
  ok(!err, 'solution uses only the given words' + (err ? ' (' + err + ')' : ''));
  for (const r of solRows) ok(!!S.parseRow(S.rowFromKeys(r)), 'parses: ' + r.join(' '));

  if (level.solution.rows) {
    const base = run(level, level.rules, baselines, 11);
    ok(!base.won, 'cannot win without changing the rules' + (base.won ? ' (won at tick ' + base.t + ')' : ''));
  }
  for (const seed of [1, 2, 3]) {
    const r = run(level, solRows, level.solution.script, seed);
    ok(r.won, 'solution wins (seed ' + seed + ')' + (r.won ? ' at tick ' + r.t : ''));
  }
}

// ----------------------------------------------------------------- speed
if (!filter) {
  console.log('speed');
  const w = new S.World(5);
  L.buildSandbox(w);
  w.setRules(S.compileBoard(rowsToIds(L.DEFAULT_RULES)).rules);
  const t0 = performance.now();
  for (let i = 0; i < 600; i++) w.tick();
  const ms = (performance.now() - t0) / 600;
  ok(ms < 4, 'sandbox tick takes ' + ms.toFixed(2) + ' ms');
}

console.log(failures ? failures + ' failure(s)' : 'all passed');
process.exit(failures ? 1 : 0);
