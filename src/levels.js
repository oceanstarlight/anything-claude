/*
 * SANDTAX levels and the sandbox diorama.
 *
 * Each puzzle lists its locked rules, the loose words the player gets, a map
 * builder, and a reference solution (final board + key script) that the test
 * suite replays to prove the level can be beaten with exactly those words.
 */
(function (root, factory) {
  const engine = typeof module === 'object' && module.exports ? require('./engine.js') : root.Sandtax;
  const api = factory(engine);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SandtaxLevels = api;
})(typeof self !== 'undefined' ? self : this, function (S) {
  'use strict';

  const { W, H, MAT } = S;
  const { SAND, WATER, STONE, FIRE, PLANT, LAVA, ICE, OIL, FLAG, EMPTY } = MAT;

  // Columns rise by at most one cell per step, so anything HEAVY can walk over it.
  function hill(g, x0, x1, baseY, h, m) {
    for (let x = x0; x <= x1; x++) {
      const t = (x - x0) / (x1 - x0);
      const hh = Math.round(h * Math.sin(Math.PI * t));
      if (hh > 0) g.rect(x, baseY - hh, x, baseY - 1, m);
    }
  }

  const floor = (g) => g.rect(0, 104, W - 1, H - 1, STONE);

  const LEVELS = [
    {
      id: 'hello',
      name: 'Hello, Sand',
      hint: 'Whatever IS YOU follows the arrow keys (or WASD). Touch whatever IS WIN.',
      rules: [['SAND', 'IS', 'YOU'], ['SAND', 'IS', 'HEAVY'], ['FLAG', 'IS', 'WIN']],
      words: [],
      build(g) {
        floor(g);
        hill(g, 60, 96, 104, 5, STONE);
        hill(g, 112, 140, 104, 3, STONE);
        g.rect(16, 88, 31, 103, SAND);
        g.flag(164, 103);
      },
      solution: { rows: null, script: [['right', 360]] },
    },
    {
      id: 'not-today',
      name: 'Not Today',
      hint: 'HEAVY things cannot climb. A rule can be broken from the inside.',
      rules: [['SAND', 'IS', 'YOU'], ['SAND', 'IS', 'HEAVY'], ['FLAG', 'IS', 'WIN']],
      words: ['NOT'],
      build(g) {
        floor(g);
        g.rect(150, 40, W - 1, 103, STONE);
        g.rect(14, 88, 29, 103, SAND);
        g.flag(170, 39);
      },
      solution: {
        rows: [['SAND', 'IS', 'YOU'], ['SAND', 'IS', 'NOT', 'HEAVY'], ['FLAG', 'IS', 'WIN']],
        script: [['up', 80], ['right', 220]],
      },
    },
    {
      id: 'shapeshifter',
      name: 'Shapeshifter',
      hint: 'Things are whatever the rules say they are.',
      rules: [['SAND', 'IS', 'YOU'], ['SAND', 'IS', 'HEAVY'], ['FLAG', 'IS', 'WIN']],
      words: ['STONE', 'IS', 'FLAG'],
      build(g) {
        floor(g);
        g.frame(10, 60, 52, 103, 3, STONE);
        g.rect(13, 84, 49, 100, SAND);
        g.flag(150, 103);
      },
      solution: {
        rows: [['SAND', 'IS', 'YOU'], ['SAND', 'IS', 'HEAVY'], ['FLAG', 'IS', 'WIN'], ['STONE', 'IS', 'FLAG']],
        script: [['wait', 10]],
      },
    },
    {
      id: 'green-bridge',
      name: 'Green Bridge',
      hint: 'Sand sinks. Something here could grow.',
      rules: [['SAND', 'IS', 'YOU'], ['SAND', 'IS', 'HEAVY'], ['FLAG', 'IS', 'WIN'], ['WATER', 'IS', 'HEAVY', 'AND', 'FLUID']],
      words: ['PLANT', 'EATS', 'WATER'],
      build(g) {
        g.rect(0, 70, 55, H - 1, STONE);
        g.rect(136, 70, W - 1, H - 1, STONE);
        g.rect(56, 112, 135, H - 1, STONE);
        g.rect(56, 70, 135, 111, WATER);
        g.rect(56, 70, 59, 75, PLANT);
        g.rect(10, 56, 25, 69, SAND);
        g.flag(170, 69);
      },
      solution: {
        rows: [['SAND', 'IS', 'YOU'], ['SAND', 'IS', 'HEAVY'], ['FLAG', 'IS', 'WIN'], ['WATER', 'IS', 'HEAVY', 'AND', 'FLUID'], ['PLANT', 'EATS', 'WATER']],
        script: [['wait', 1100], ['right', 420]],
      },
    },
    {
      id: 'meltdown',
      name: 'Meltdown',
      hint: 'HOT destroys anything that IS MELT.',
      rules: [['SAND', 'IS', 'YOU'], ['SAND', 'IS', 'HEAVY'], ['FLAG', 'IS', 'WIN'], ['FLAG', 'IS', 'HEAVY'], ['ICE', 'IS', 'MELT']],
      words: ['SAND', 'FLAG', 'IS', 'HOT'],
      build(g) {
        floor(g);
        g.rect(76, 0, 77, 39, STONE);
        g.rect(114, 0, 115, 39, STONE);
        g.rect(76, 40, 115, 45, ICE);
        g.rect(88, 26, 103, 39, FLAG);
        g.rect(12, 88, 27, 103, SAND);
      },
      solution: {
        rows: [['SAND', 'IS', 'YOU'], ['SAND', 'IS', 'HEAVY'], ['FLAG', 'IS', 'WIN'], ['FLAG', 'IS', 'HEAVY'], ['ICE', 'IS', 'MELT'], ['FLAG', 'IS', 'HOT']],
        script: [['wait', 300], ['right', 260]],
      },
    },
    {
      id: 'frozen-assets',
      name: 'Frozen Assets',
      hint: 'X HAS Y: when X is destroyed, it leaves Y behind.',
      rules: [['SAND', 'IS', 'YOU'], ['SAND', 'IS', 'HEAVY', 'AND', 'HOT'], ['ICE', 'IS', 'MELT'], ['FLAG', 'IS', 'WIN']],
      words: ['ICE', 'HAS', 'FLAG'],
      build(g) {
        floor(g);
        g.rect(12, 88, 27, 103, SAND);
        g.rect(92, 78, 113, 103, ICE);
        g.rect(96, 70, 109, 77, ICE);
      },
      solution: {
        rows: [['SAND', 'IS', 'YOU'], ['SAND', 'IS', 'HEAVY', 'AND', 'HOT'], ['ICE', 'IS', 'MELT'], ['FLAG', 'IS', 'WIN'], ['ICE', 'HAS', 'FLAG']],
        script: [['right', 300]],
      },
    },
    {
      id: 'firewall',
      name: 'Firewall',
      hint: 'Fire that never dies is just another wall.',
      rules: [['SAND', 'IS', 'YOU'], ['SAND', 'IS', 'HEAVY'], ['FLAG', 'IS', 'WIN'], ['FIRE', 'IS', 'HOT']],
      words: ['FIRE', 'EATS', 'PLANT', 'AND', 'BRIEF'],
      build(g) {
        floor(g);
        g.rect(150, 60, W - 1, 67, PLANT);
        g.rect(150, 60, 157, 103, PLANT);
        g.flag(170, 103);
        g.rect(136, 68, 149, 69, STONE);
        g.rect(144, 61, 149, 67, FIRE);
        g.rect(12, 88, 27, 103, SAND);
      },
      solution: {
        rows: [['SAND', 'IS', 'YOU'], ['SAND', 'IS', 'HEAVY'], ['FLAG', 'IS', 'WIN'], ['FIRE', 'IS', 'HOT', 'AND', 'BRIEF'], ['FIRE', 'EATS', 'PLANT']],
        script: [['wait', 1000], ['right', 400]],
      },
    },
    {
      id: 'kaboom',
      name: 'Kaboom',
      hint: 'BOOM explodes on contact with anything HOT.',
      rules: [
        ['SAND', 'IS', 'YOU'], ['SAND', 'IS', 'HEAVY'], ['FLAG', 'IS', 'WIN'], ['FLAG', 'IS', 'HEAVY'],
        ['LAVA', 'IS', 'HOT'], ['FIRE', 'IS', 'FLOATY', 'AND', 'HOT', 'AND', 'BRIEF'],
      ],
      words: ['OIL', 'IS', 'BOOM'],
      build(g) {
        floor(g);
        g.rect(80, 14, 83, 50, STONE);
        g.rect(117, 14, 120, 50, STONE);
        g.rect(80, 14, 120, 17, STONE);
        g.rect(80, 41, 120, 50, STONE);
        g.rect(86, 43, 114, 47, OIL);
        g.rect(99, 46, 101, 47, LAVA);
        g.rect(92, 22, 108, 40, FLAG);
        g.rect(12, 88, 27, 103, SAND);
      },
      solution: {
        rows: [
          ['SAND', 'IS', 'YOU'], ['SAND', 'IS', 'HEAVY'], ['FLAG', 'IS', 'WIN'], ['FLAG', 'IS', 'HEAVY'],
          ['LAVA', 'IS', 'HOT'], ['FIRE', 'IS', 'FLOATY', 'AND', 'HOT', 'AND', 'BRIEF'], ['OIL', 'IS', 'BOOM'],
        ],
        script: [['wait', 300], ['right', 300]],
      },
    },
    {
      id: 'extension',
      name: 'Extension',
      hint: 'HEAVY and FLOATY cancel out.',
      rules: [['WATER', 'IS', 'YOU'], ['WATER', 'IS', 'HEAVY', 'AND', 'FLUID'], ['FLAG', 'IS', 'WIN']],
      words: ['AND', 'FLOATY'],
      build(g) {
        floor(g);
        g.rect(8, 90, 47, 103, WATER);
        g.rect(138, 0, 173, 5, STONE);
        g.rect(150, 6, 151, 30, FLAG);
        g.rect(152, 6, 163, 13, FLAG);
        g.rect(152, 14, 157, 15, FLAG);
      },
      solution: {
        rows: [['WATER', 'IS', 'YOU'], ['WATER', 'IS', 'HEAVY', 'AND', 'FLUID', 'AND', 'FLOATY'], ['FLAG', 'IS', 'WIN']],
        script: [['up', 140], ['right', 200]],
      },
    },
    {
      id: 'hungry',
      name: 'Hungry',
      hint: 'You are sealed in. Eat your way out.',
      rules: [['SAND', 'IS', 'YOU'], ['SAND', 'IS', 'HEAVY'], ['FLAG', 'IS', 'WIN']],
      words: ['SAND', 'EATS', 'STONE', 'EMPTY'],
      build(g) {
        g.rect(0, 0, W - 1, H - 1, STONE);
        g.rect(8, 8, 32, 30, EMPTY);
        g.rect(10, 18, 30, 30, SAND);
        g.rect(148, 82, 184, 111, EMPTY);
        g.flag(160, 111);
        g.circle(70, 44, 11, EMPTY);
        g.circle(116, 30, 13, EMPTY);
        g.rect(36, 84, 66, 90, EMPTY);
        g.rect(96, 60, 126, 65, EMPTY);
        g.circle(170, 40, 9, EMPTY);
      },
      solution: {
        rows: [['SAND', 'IS', 'YOU'], ['SAND', 'IS', 'HEAVY'], ['FLAG', 'IS', 'WIN'], ['SAND', 'EATS', 'STONE']],
        script: [['wait', 600], ['right', 2400]],
      },
    },
  ];

  // ------------------------------------------------------------- sandbox
  const DEFAULT_RULES = [
    ['SAND', 'IS', 'HEAVY'],
    ['WATER', 'IS', 'HEAVY', 'AND', 'FLUID', 'AND', 'COLD'],
    ['OIL', 'IS', 'HEAVY', 'AND', 'FLUID'],
    ['LAVA', 'IS', 'HEAVY', 'AND', 'FLUID', 'AND', 'HOT'],
    ['FIRE', 'IS', 'FLOATY', 'AND', 'HOT', 'AND', 'BRIEF'],
    ['SMOKE', 'IS', 'FLOATY', 'AND', 'FLUID', 'AND', 'BRIEF'],
    ['FIRE', 'HAS', 'SMOKE'],
    ['LAVA', 'HAS', 'STONE'],
    ['ICE', 'IS', 'MELT'],
    ['ICE', 'HAS', 'WATER'],
    ['FIRE', 'EATS', 'PLANT', 'AND', 'OIL'],
    ['PLANT', 'EATS', 'WATER'],
  ];

  const RECIPES = [
    { name: 'Rain falls up', add: [['WATER', 'IS', 'FLOATY', 'AND', 'NOT', 'HEAVY']], note: 'The lake pours into the sky.' },
    { name: 'Upside down', add: [['ALL', 'IS', 'FLOATY', 'AND', 'NOT', 'HEAVY']], note: 'Even stone falls upward now.' },
    { name: 'Snowfall', add: [['EMPTY', 'MAKES', 'ICE'], ['ICE', 'IS', 'HEAVY']], note: 'Snow piles up and melts on lava.' },
    { name: 'Overgrowth', add: [['PLANT', 'EATS', 'EMPTY']], note: 'Let it grow, then paint some FIRE.' },
    { name: 'Grey goo', add: [['SAND', 'EATS', 'ALL']], note: 'Sand converts whatever it touches.' },
    { name: 'Powder keg', add: [['OIL', 'IS', 'BOOM'], ['WATER', 'IS', 'OIL']], note: 'The lake is oil now. Paint FIRE or LAVA beside it.' },
    { name: 'Swap meet', add: [['SAND', 'IS', 'WATER'], ['WATER', 'IS', 'SAND']], note: 'A cycle swaps once each time the rule appears.' },
    { name: 'Play as water', add: [['WATER', 'IS', 'YOU'], ['FLAG', 'IS', 'WIN']], note: 'Steer the lake to the flag with the arrow keys.' },
  ];

  function buildSandbox(world) {
    const g = S.painter(world);
    world.clear();
    const ground = new Array(W);
    for (let x = 0; x < W; x++) {
      ground[x] = 100 + Math.round(3 * Math.sin(x / 13) + 2 * Math.sin(x / 5.3 + 1) + 2 * Math.sin(x / 29 + 2));
      g.rect(x, ground[x], x, H - 1, STONE);
    }
    // Lake basin.
    const lx0 = 34, lx1 = 84;
    const rim = Math.min(ground[lx0 - 1], ground[lx1 + 1]);
    for (let x = lx0; x <= lx1; x++) {
      const bottom = rim + 2 + Math.round(11 * Math.sin((Math.PI * (x - lx0)) / (lx1 - lx0)));
      g.rect(x, Math.min(ground[x], rim), x, bottom - 1, EMPTY);
      g.rect(x, rim + 2, x, bottom - 1, WATER);
      ground[x] = bottom;
    }
    // Sand dune.
    for (let x = 118; x <= 170; x++) {
      const h = Math.round(20 * Math.exp(-Math.pow((x - 144) / 13, 2)));
      if (h > 0) g.rect(x, ground[x] - h, x, ground[x] - 1, SAND);
    }
    // Lava pool in a stone bowl.
    g.rect(172, 92, 189, 112, STONE);
    g.rect(175, 94, 186, 109, EMPTY);
    g.rect(175, 99, 186, 109, LAVA);
    // Grass and a tree on the left hills, away from the lake.
    for (let x = 4; x <= 28; x++) {
      const h = 1 + (((x * 7919) % 5) === 0 ? 3 : (x * 31) % 3);
      g.rect(x, ground[x] - h, x, ground[x] - 1, PLANT);
    }
    const tx = 95;
    g.rect(tx, ground[tx] - 16, tx + 1, ground[tx] - 1, PLANT);
    g.circle(tx, ground[tx] - 22, 7, PLANT);
    g.circle(tx + 6, ground[tx] - 18, 4, PLANT);
    // Floating glacier.
    g.rect(10, 44, 42, 47, STONE);
    for (let x = 12; x <= 40; x++) {
      const h = Math.round(9 * Math.sin((Math.PI * (x - 10)) / 32));
      g.rect(x, 44 - h, x, 43, ICE);
    }
    // Oil tray.
    g.rect(104, 52, 134, 53, STONE);
    g.rect(104, 47, 105, 51, STONE);
    g.rect(133, 47, 134, 51, STONE);
    g.rect(106, 48, 132, 51, OIL);
    // Sand island.
    g.rect(58, 28, 82, 30, STONE);
    for (let x = 60; x <= 80; x++) {
      const h = Math.round(7 * Math.sin((Math.PI * (x - 59)) / 22));
      if (h > 0) g.rect(x, 28 - h, x, 27, SAND);
    }
    // Spire with a flag.
    g.rect(160, 62, 163, ground[161] - 1, STONE);
    g.flag(161, 61);
    return world;
  }

  function buildLevel(world, level) {
    world.clear();
    level.build(S.painter(world));
    return world;
  }

  return { LEVELS, DEFAULT_RULES, RECIPES, buildSandbox, buildLevel };
});
