/*
 * SANDTAX engine — a falling-sand world whose physics is nothing but sentences.
 *
 * Every behaviour (falling, flowing, burning, melting, being steered by the
 * player) comes from rules such as "SAND IS HEAVY" or "FIRE EATS PLANT".
 * There is no hidden physics: an empty rule list means a frozen world.
 *
 * Runs in the browser (window.Sandtax) and in Node (module.exports) so the
 * puzzles can be verified headlessly.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Sandtax = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const W = 192;
  const H = 120;
  const N = W * H;

  // ---------------------------------------------------------------- materials
  const MATS = [
    { key: 'EMPTY', density: 0, rgb: [0, 0, 0], vary: 0 },
    { key: 'SAND', density: 90, rgb: [228, 190, 118], vary: 26 },
    { key: 'WATER', density: 60, rgb: [52, 116, 232], vary: 14 },
    { key: 'STONE', density: 100, rgb: [112, 110, 132], vary: 20 },
    { key: 'FIRE', density: 20, rgb: [255, 140, 40], vary: 30 },
    { key: 'SMOKE', density: 10, rgb: [120, 114, 138], vary: 18 },
    { key: 'PLANT', density: 70, rgb: [70, 178, 92], vary: 34 },
    { key: 'LAVA', density: 80, rgb: [255, 82, 36], vary: 26 },
    { key: 'ICE', density: 55, rgb: [170, 228, 255], vary: 18 },
    { key: 'OIL', density: 50, rgb: [104, 62, 104], vary: 14 },
    { key: 'FLAG', density: 95, rgb: [255, 206, 60], vary: 24 },
  ];
  const NM = MATS.length;
  const MAT = {};
  MATS.forEach((m, i) => { MAT[m.key] = i; });
  const DENS = new Uint8Array(MATS.map((m) => m.density));
  const ALL_MATS = [];
  for (let m = 1; m < NM; m++) ALL_MATS.push(m);

  // ------------------------------------------------------------------- words
  const PROP_KEYS = ['YOU', 'WIN', 'HEAVY', 'FLOATY', 'FLUID', 'STILL', 'HOT', 'COLD', 'MELT', 'BRIEF', 'BOOM', 'SINK'];
  const P = {};
  PROP_KEYS.forEach((k, i) => { P[k] = 1 << i; });
  const MOVABLE = P.HEAVY | P.FLOATY | P.FLUID;

  const NOUN_KEYS = ['SAND', 'WATER', 'STONE', 'FIRE', 'SMOKE', 'PLANT', 'LAVA', 'ICE', 'OIL', 'FLAG', 'ALL', 'EMPTY'];
  const VERB_KEYS = ['IS', 'EATS', 'MAKES', 'HAS'];
  const LINK_KEYS = ['AND', 'NOT'];

  const WORDS = [];
  NOUN_KEYS.forEach((k) => WORDS.push({ key: k, type: 'noun', mat: k === 'ALL' ? -1 : MAT[k] }));
  VERB_KEYS.forEach((k) => WORDS.push({ key: k, type: 'verb' }));
  LINK_KEYS.forEach((k) => WORDS.push({ key: k, type: k.toLowerCase() }));
  PROP_KEYS.forEach((k) => WORDS.push({ key: k, type: 'prop', bit: P[k] }));
  const WID = {};
  WORDS.forEach((w, i) => { w.id = i; WID[w.key] = i; });

  // Rates (per tick, per touching neighbour where relevant).
  const EAT_P = 0.09;
  const EAT_EMPTY_P = 0.02;
  const MAKE_P = 0.04;
  const RAIN_P = 0.0007;
  const MELT_P = 0.35;
  const QUENCH_P = 0.5;
  const SINK_P = 0.5;
  const SWAP_P = 0.4;
  const SPREAD = 3;

  // ------------------------------------------------------------------ parser
  // sentence := NOUN (AND NOUN)* VERB OBJ (AND OBJ)*
  // OBJ      := NOT* (NOUN | PROP)      PROP only after IS, NOT only after IS/EATS
  function parseRow(ids) {
    const t = ids.map((id) => WORDS[id]);
    const n = t.length;
    if (n < 3) return null;
    let i = 0;
    if (t[0].type !== 'noun') return null;
    const subj = [t[i++]];
    while (i + 1 < n && t[i].key === 'AND' && t[i + 1].type === 'noun') {
      subj.push(t[i + 1]);
      i += 2;
    }
    const verb = t[i];
    if (!verb || verb.type !== 'verb') return null;
    i++;
    const objs = [];
    for (;;) {
      let neg = false;
      while (i < n && t[i].key === 'NOT') { neg = !neg; i++; }
      const o = t[i];
      if (!o) return null;
      if (o.type === 'prop') {
        if (verb.key !== 'IS') return null;
      } else if (o.type !== 'noun') {
        return null;
      }
      if (neg && verb.key !== 'IS' && verb.key !== 'EATS') return null;
      objs.push({ w: o, neg });
      i++;
      if (i < n && t[i].key === 'AND') { i++; continue; }
      break;
    }
    if (i !== n) return null;
    return { subj, verb: verb.key, objs };
  }

  function sentenceText(s) {
    const subj = s.subj.map((w) => w.key).join(' AND ');
    const objs = s.objs.map((o) => (o.neg ? 'NOT ' : '') + o.w.key).join(' AND ');
    return subj + ' ' + s.verb + ' ' + objs;
  }

  // ----------------------------------------------------------------- compile
  function expand(w, exclude) {
    if (w.mat === -1) return ALL_MATS.filter((m) => m !== exclude);
    return [w.mat];
  }

  function compile(sentences) {
    const pos = new Uint16Array(NM);
    const neg = new Uint16Array(NM);
    const trans = Array.from({ length: NM }, () => new Set());
    const negT = Array.from({ length: NM }, () => new Set());
    const selfLock = new Uint8Array(NM);
    const eatenBy = new Uint16Array(NM);
    const makes = Array.from({ length: NM }, () => []);
    const has = Array.from({ length: NM }, () => []);

    for (const s of sentences) {
      for (const sw of s.subj) {
        const subjects = sw.mat === -1 ? ALL_MATS : [sw.mat];
        for (const sm of subjects) {
          for (const o of s.objs) {
            const ow = o.w;
            if (s.verb === 'IS') {
              if (ow.type === 'prop') {
                (o.neg ? neg : pos)[sm] |= ow.bit;
              } else if (ow.mat === sm) {
                if (!o.neg) selfLock[sm] = 1;
              } else {
                for (const tm of expand(ow, sm)) (o.neg ? negT : trans)[sm].add(tm);
              }
            } else if (s.verb === 'EATS') {
              let targets;
              if (o.neg) {
                const excluded = expand(ow, -2);
                targets = ALL_MATS.filter((m) => excluded.indexOf(m) < 0);
              } else {
                targets = expand(ow, sm);
              }
              for (const tm of targets) if (tm !== sm) eatenBy[tm] |= 1 << sm;
            } else if (s.verb === 'MAKES') {
              for (const tm of expand(ow, sm)) if (tm !== sm && tm !== 0) makes[sm].push(tm);
            } else if (s.verb === 'HAS') {
              for (const tm of expand(ow, sm)) has[sm].push(tm);
            }
          }
        }
      }
    }

    const props = new Uint16Array(NM);
    let any = 0;
    for (let m = 1; m < NM; m++) {
      props[m] = pos[m] & ~neg[m];
      any |= props[m];
    }

    const transArr = new Array(NM).fill(null);
    let anyTrans = false;
    for (let m = 0; m < NM; m++) {
      if (selfLock[m]) continue;
      const arr = [...trans[m]].filter((t) => !negT[m].has(t)).sort((a, b) => a - b);
      if (arr.length) { transArr[m] = arr; anyTrans = true; }
    }

    // Transformation cycles (A IS B, B IS A) fire once per rule change instead
    // of every tick, otherwise the screen would strobe.
    const cyclic = new Uint8Array(NM);
    for (let m = 0; m < NM; m++) {
      if (!transArr[m]) continue;
      const seen = new Set();
      const stack = [...transArr[m]];
      while (stack.length) {
        const t = stack.pop();
        if (t === m) { cyclic[m] = 1; break; }
        if (seen.has(t)) continue;
        seen.add(t);
        if (transArr[t]) stack.push(...transArr[t]);
      }
    }

    let anyEat = false;
    for (let m = 0; m < NM; m++) if (eatenBy[m]) anyEat = true;

    return {
      props,
      any,
      trans: transArr,
      cyclic,
      anyTrans,
      eatenBy,
      anyEat,
      makes: makes.map((a) => (a.length ? a : null)),
      has: has.map((a) => (a.length ? a : null)),
    };
  }

  // Parse a board (array of rows of word ids) into rules + per-row validity.
  function compileBoard(rows) {
    const sentences = [];
    const valid = rows.map((row) => {
      const s = parseRow(row);
      if (s) sentences.push(s);
      return s;
    });
    return { rules: compile(sentences), sentences, valid };
  }

  // ------------------------------------------------------------------- world
  class World {
    constructor(seed) {
      this.mat = new Uint8Array(N);
      this.life = new Uint8Array(N);
      this.shade = new Uint8Array(N);
      this.stamp = new Uint8Array(N);
      this.ystamp = new Uint8Array(N);
      this.clock = 0;
      this.seed = (seed >>> 0) || 0x9e3779b9;
      this.rules = compile([]);
      this.oneShot = new Uint8Array(NM);
      this.input = { dx: 0, dy: 0 };
      this.won = false;
      this.events = [];
      this.ticks = 0;
    }

    rand() {
      let x = this.seed;
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      this.seed = x >>> 0;
      return this.seed / 4294967296;
    }

    set(i, m) {
      this.mat[i] = m;
      this.life[i] = 0;
      this.shade[i] = (this.rand() * 256) | 0;
    }

    clear() {
      this.mat.fill(0);
      this.life.fill(0);
      this.won = false;
    }

    setRules(R) {
      const old = this.rules;
      for (let m = 0; m < NM; m++) {
        const a = R.trans[m];
        const b = old.trans[m];
        if (a && (!b || a.join() !== b.join())) this.oneShot[m] = 1;
      }
      this.rules = R;
    }

    count(m) {
      let c = 0;
      for (let i = 0; i < N; i++) if (this.mat[i] === m) c++;
      return c;
    }

    pick(arr) {
      return arr.length === 1 ? arr[0] : arr[(this.rand() * arr.length) | 0];
    }

    destroy(i) {
      const h = this.rules.has[this.mat[i]];
      this.set(i, h ? this.pick(h) : 0);
      this.stamp[i] = this.clock;
    }

    swap(i, j) {
      const mat = this.mat, life = this.life, shade = this.shade;
      let t = mat[i]; mat[i] = mat[j]; mat[j] = t;
      t = life[i]; life[i] = life[j]; life[j] = t;
      t = shade[i]; shade[i] = shade[j]; shade[j] = t;
      this.stamp[i] = this.clock;
      this.stamp[j] = this.clock;
    }

    swapRaw(i, j) {
      const mat = this.mat, life = this.life, shade = this.shade;
      let t = mat[i]; mat[i] = mat[j]; mat[j] = t;
      t = life[i]; life[i] = life[j]; life[j] = t;
      t = shade[i]; shade[i] = shade[j]; shade[j] = t;
    }

    // Index of a 4-neighbour whose properties include `bit`, or -1.
    neighborProp(i, x, y, bit) {
      const mat = this.mat, props = this.rules.props;
      if (y > 0 && props[mat[i - W]] & bit) return i - W;
      if (y < H - 1 && props[mat[i + W]] & bit) return i + W;
      if (x > 0 && props[mat[i - 1]] & bit) return i - 1;
      if (x < W - 1 && props[mat[i + 1]] & bit) return i + 1;
      return -1;
    }

    // Material of a random-ish 4-neighbour that is allowed to eat this cell.
    eater(i, x, y, mask) {
      const mat = this.mat, stamp = this.stamp, clock = this.clock;
      const start = (this.rand() * 4) | 0;
      for (let k = 0; k < 4; k++) {
        const d = (start + k) & 3;
        let j;
        if (d === 0) { if (y === 0) continue; j = i - W; }
        else if (d === 1) { if (x === W - 1) continue; j = i + 1; }
        else if (d === 2) { if (y === H - 1) continue; j = i + W; }
        else { if (x === 0) continue; j = i - 1; }
        if (stamp[j] === clock) continue;
        const m = mat[j];
        if (mask & (1 << m)) return m;
      }
      return -1;
    }

    randomNeighbor(i, x, y) {
      const d = (this.rand() * 4) | 0;
      if (d === 0) return y > 0 ? i - W : -1;
      if (d === 1) return x < W - 1 ? i + 1 : -1;
      if (d === 2) return y < H - 1 ? i + W : -1;
      return x > 0 ? i - 1 : -1;
    }

    explode(cx, cy) {
      const r = 5 + ((this.rand() * 3) | 0);
      const r2 = r * r;
      const mat = this.mat, has = this.rules.has;
      for (let dy = -r; dy <= r; dy++) {
        const y = cy + dy;
        if (y < 0 || y >= H) continue;
        for (let dx = -r; dx <= r; dx++) {
          const x = cx + dx;
          if (x < 0 || x >= W || dx * dx + dy * dy > r2) continue;
          const j = y * W + x;
          const m = mat[j];
          if (m !== 0) {
            const h = has[m];
            this.set(j, h ? this.pick(h) : 0);
          }
          if (mat[j] === 0 && this.rand() < 0.5) this.set(j, MAT.FIRE);
          this.stamp[j] = this.clock;
        }
      }
      this.events.push({ type: 'boom', x: cx, y: cy });
    }

    canEnter(m, j, gy) {
      const k = this.mat[j];
      if (k === 0) return true;
      if (this.stamp[j] === this.clock) return false;
      const pk = this.rules.props[k];
      if (pk & P.STILL || !(pk & MOVABLE)) return false;
      const dm = DENS[m], dk = DENS[k];
      if (gy > 0 ? dm > dk : dm < dk) return this.rand() < SWAP_P;
      return false;
    }

    spread(i, x) {
      const mat = this.mat;
      const r = this.rand() < 0.5 ? 1 : -1;
      for (let pass = 0; pass < 2; pass++) {
        const dir = pass === 0 ? r : -r;
        let best = -1;
        for (let k = 1; k <= SPREAD; k++) {
          const nx = x + dir * k;
          if (nx < 0 || nx >= W) break;
          const j = i + dir * k;
          if (mat[j] !== 0) break;
          best = j;
        }
        if (best >= 0) { this.swap(i, best); return; }
      }
    }

    move(i, x, y, m, p) {
      let gy = 0;
      if (p & P.HEAVY) gy++;
      if (p & P.FLOATY) gy--;
      const fluid = p & P.FLUID;
      if (gy !== 0) {
        const ny = y + gy;
        if (ny >= 0 && ny < H) {
          const j = i + gy * W;
          if (this.canEnter(m, j, gy)) { this.swap(i, j); return; }
          const r = this.rand() < 0.5 ? 1 : -1;
          if (x + r >= 0 && x + r < W && this.canEnter(m, j + r, gy)) { this.swap(i, j + r); return; }
          if (x - r >= 0 && x - r < W && this.canEnter(m, j - r, gy)) { this.swap(i, j - r); return; }
        }
        if (fluid) this.spread(i, x);
      } else if (fluid) {
        if (this.rand() < 0.45) {
          const j = this.randomNeighbor(i, x, y);
          if (j >= 0 && this.mat[j] === 0) this.swap(i, j);
        }
      }
    }

    // `wade` lets the step push through liquids and gases; side-steps and
    // step-ups only go into empty space, so nothing can climb up through water.
    youTry(i, nx, ny, wade) {
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) return false;
      const j = ny * W + nx;
      const k = this.mat[j];
      if (k !== 0) {
        if (!wade) return false;
        const pk = this.rules.props[k];
        if (pk & P.YOU || pk & P.STILL || !(pk & MOVABLE)) return false;
      }
      this.swapRaw(i, j);
      this.ystamp[j] = this.clock;
      return true;
    }

    // Everything that IS YOU tries to step in the held direction. Cells are
    // visited front-first so a blob moves as one body instead of stretching.
    moveYou(dx, dy) {
      const props = this.rules.props, mat = this.mat, ys = this.ystamp, clock = this.clock;
      const y0 = dy > 0 ? H - 1 : 0, y1 = dy > 0 ? -1 : H, ystep = dy > 0 ? -1 : 1;
      const x0 = dx > 0 ? W - 1 : 0, x1 = dx > 0 ? -1 : W, xstep = dx > 0 ? -1 : 1;
      for (let y = y0; y !== y1; y += ystep) {
        for (let x = x0; x !== x1; x += xstep) {
          const i = y * W + x;
          const m = mat[i];
          if (m === 0) continue;
          const p = props[m];
          if (!(p & P.YOU) || p & P.STILL || ys[i] === clock) continue;
          const heavy = (p & P.HEAVY) && !(p & P.FLOATY);
          const floaty = (p & P.FLOATY) && !(p & P.HEAVY);
          let mdx = dx, mdy = dy;
          if (heavy && mdy < 0) mdy = 0;
          if (floaty && mdy > 0) mdy = 0;
          if (!mdx && !mdy) continue;
          if (this.youTry(i, x + mdx, y + mdy, true)) continue;
          if (mdx && mdy) {
            if (this.youTry(i, x + mdx, y, true)) continue;
            this.youTry(i, x, y + mdy, true);
          } else if (mdx) {
            if (heavy) this.youTry(i, x + mdx, y - 1);
            else if (floaty) this.youTry(i, x + mdx, y + 1);
            else {
              const s = this.rand() < 0.5 ? 1 : -1;
              if (!this.youTry(i, x + mdx, y + s)) this.youTry(i, x + mdx, y - s);
            }
          } else {
            const s = this.rand() < 0.5 ? 1 : -1;
            if (!this.youTry(i, x + s, y + mdy)) this.youTry(i, x - s, y + mdy);
          }
        }
      }
    }

    update(i, x, y) {
      const R = this.rules, mat = this.mat, stamp = this.stamp, clock = this.clock;
      const m = mat[i];

      if (m === 0) {
        if (R.eatenBy[0]) {
          const e = this.eater(i, x, y, R.eatenBy[0]);
          if (e >= 0 && this.rand() < EAT_EMPTY_P) { this.set(i, e); stamp[i] = clock; return; }
        }
        if (R.makes[0] && this.rand() < RAIN_P) { this.set(i, this.pick(R.makes[0])); stamp[i] = clock; }
        return;
      }

      const p = R.props[m];

      if (p & P.BRIEF) {
        const l = this.life[i];
        if (l === 0) this.life[i] = 40 + ((this.rand() * 80) | 0);
        else if (l === 1) { this.destroy(i); return; }
        else this.life[i] = l - 1;
      }

      if (p & P.SINK) {
        let j = -1;
        if (y < H - 1 && mat[i + W] !== 0 && mat[i + W] !== m) j = i + W;
        else if (y > 0 && mat[i - W] !== 0 && mat[i - W] !== m) j = i - W;
        else if (x > 0 && mat[i - 1] !== 0 && mat[i - 1] !== m) j = i - 1;
        else if (x < W - 1 && mat[i + 1] !== 0 && mat[i + 1] !== m) j = i + 1;
        if (j >= 0 && this.rand() < SINK_P) {
          this.destroy(j);
          this.destroy(i);
          this.events.push({ type: 'sink', x, y });
          return;
        }
      }

      if (p & P.HOT && R.any & P.COLD && this.neighborProp(i, x, y, P.COLD) >= 0 && this.rand() < QUENCH_P) {
        this.destroy(i);
        this.events.push({ type: 'hiss', x, y });
        return;
      }
      if (p & P.MELT && R.any & P.HOT && this.neighborProp(i, x, y, P.HOT) >= 0 && this.rand() < MELT_P) {
        this.destroy(i);
        return;
      }
      if (p & P.BOOM && R.any & P.HOT && this.neighborProp(i, x, y, P.HOT) >= 0) {
        this.explode(x, y);
        return;
      }

      const em = R.eatenBy[m];
      if (em) {
        const e = this.eater(i, x, y, em);
        if (e >= 0 && this.rand() < EAT_P) { this.set(i, e); stamp[i] = clock; return; }
      }

      const mk = R.makes[m];
      if (mk && this.rand() < MAKE_P) {
        const j = this.randomNeighbor(i, x, y);
        if (j >= 0 && mat[j] === 0) { this.set(j, this.pick(mk)); stamp[j] = clock; }
      }

      if (p & P.STILL || !(p & MOVABLE)) return;
      this.move(i, x, y, m, p);
    }

    tick() {
      const R = this.rules, mat = this.mat, stamp = this.stamp;
      this.clock = this.clock >= 250 ? 1 : this.clock + 1;
      const clock = this.clock;
      this.events.length = 0;
      this.ticks++;

      if (R.anyTrans) {
        const trans = R.trans, cyclic = R.cyclic, oneShot = this.oneShot;
        for (let i = 0; i < N; i++) {
          const m = mat[i];
          const t = trans[m];
          if (t && (!cyclic[m] || oneShot[m])) {
            this.set(i, this.pick(t));
            stamp[i] = clock;
          }
        }
      }
      this.oneShot.fill(0);

      if (R.any & P.YOU && (this.input.dx || this.input.dy)) this.moveYou(this.input.dx, this.input.dy);

      for (let y = H - 1; y >= 0; y--) {
        const ltr = ((y + clock) & 1) === 0;
        const row = y * W;
        for (let k = 0; k < W; k++) {
          const x = ltr ? k : W - 1 - k;
          const i = row + x;
          if (stamp[i] === clock) continue;
          this.update(i, x, y);
        }
      }

      if (R.any & P.YOU && R.any & P.WIN && !this.won) {
        const props = R.props;
        for (let i = 0; i < N; i++) {
          const p = props[mat[i]];
          if (!(p & P.YOU)) continue;
          const x = i % W, y = (i / W) | 0;
          if (p & P.WIN || this.neighborProp(i, x, y, P.WIN) >= 0) {
            this.won = true;
            this.events.push({ type: 'win', x, y });
            break;
          }
        }
      }
    }
  }

  // ----------------------------------------------------------- scene helpers
  function painter(world) {
    const set = (x, y, m) => {
      if (x < 0 || x >= W || y < 0 || y >= H) return;
      world.set(y * W + x, m);
    };
    const g = {
      set,
      rect(x0, y0, x1, y1, m) {
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, m);
        return g;
      },
      frame(x0, y0, x1, y1, t, m) {
        g.rect(x0, y0, x1, y0 + t - 1, m);
        g.rect(x0, y1 - t + 1, x1, y1, m);
        g.rect(x0, y0, x0 + t - 1, y1, m);
        g.rect(x1 - t + 1, y0, x1, y1, m);
        return g;
      },
      circle(cx, cy, r, m) {
        for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) set(cx + x, cy + y, m);
        return g;
      },
      flag(x, y) {
        // A pole with a pennant; (x, y) is the bottom of the pole.
        g.rect(x, y - 25, x + 1, y, MAT.FLAG);
        g.rect(x + 2, y - 25, x + 13, y - 18, MAT.FLAG);
        g.rect(x + 2, y - 17, x + 8, y - 16, MAT.FLAG);
        return g;
      },
    };
    return g;
  }

  // ------------------------------------------------------- share-code codec
  const ALPHA = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  function encodeRows(rows) {
    return 'r_' + rows.filter((r) => r.length).map((r) => r.map((id) => ALPHA[id]).join('')).join('-');
  }

  function decodeRows(code) {
    const m = /^#?r_([A-Za-z0-9-]*)$/.exec(String(code).trim());
    if (!m) return null;
    const rows = [];
    for (const part of m[1].split('-')) {
      if (!part) continue;
      const row = [];
      for (const ch of part) {
        const id = ALPHA.indexOf(ch);
        if (id < 0 || id >= WORDS.length) return null;
        row.push(id);
      }
      rows.push(row);
    }
    return rows;
  }

  function rowFromKeys(keys) {
    return keys.map((k) => {
      if (!(k in WID)) throw new Error('Unknown word ' + k);
      return WID[k];
    });
  }

  return {
    W, H, N, MATS, MAT, NM, DENS, P, PROP_KEYS, WORDS, WID, ALL_MATS,
    parseRow, sentenceText, compile, compileBoard, World, painter,
    encodeRows, decodeRows, rowFromKeys,
  };
});
