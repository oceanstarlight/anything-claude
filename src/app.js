/* SANDTAX app: rendering, the law board, painting, puzzles, sound. */
(function () {
  'use strict';

  const S = window.Sandtax;
  const L = window.SandtaxLevels;
  const { W, H, N, MAT, MATS, WORDS, WID, P } = S;
  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------- storage
  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem('sandtax:' + k);
        return v == null ? d : JSON.parse(v);
      } catch (e) { return d; }
    },
    set(k, v) {
      try { localStorage.setItem('sandtax:' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ }
    },
  };

  // ------------------------------------------------------------- word data
  const COLOR = {
    SAND: '#e4be76', WATER: '#5b9bff', STONE: '#b0acc7', FIRE: '#ff9a3c', SMOKE: '#a59fb8', PLANT: '#5fd17a',
    LAVA: '#ff6a3d', ICE: '#aee6ff', OIL: '#c993d4', FLAG: '#ffd23f', ALL: '#f4f0ff', EMPTY: '#8d86a8',
    YOU: '#ff6fae', WIN: '#ffd23f', HEAVY: '#d0995a', FLOATY: '#a8dcff', FLUID: '#6aa6ff', STILL: '#a3a7ba',
    HOT: '#ff7a2e', COLD: '#6fe3ff', MELT: '#c6f0ff', BRIEF: '#b993ff', BOOM: '#ff4d61', SINK: '#3fd0b0',
  };
  const INFO = {
    SAND: 'Grains. Falls and piles up when it IS HEAVY.',
    WATER: 'Water. Flows when it IS FLUID.',
    STONE: 'Rock. Has no laws by default, so it stays put.',
    FIRE: 'Flame. By default it rises, burns and leaves smoke.',
    SMOKE: 'Smoke. Drifts up and fades.',
    PLANT: 'Plant. Grows into water by default.',
    LAVA: 'Molten rock. HOT, and leaves stone when it cools.',
    ICE: 'Ice. MELT by default and leaves water behind.',
    OIL: 'Oil. Lighter than water and it burns.',
    FLAG: 'A golden flag. Usually the thing that IS WIN.',
    ALL: 'Every material at once. ALL IS FLOATY lifts the whole world.',
    EMPTY: 'The space between things. EMPTY IS WATER floods the world.',
    IS: 'Gives a property (SAND IS HOT) or turns one thing into another (SAND IS WATER).',
    EATS: 'X EATS Y: any Y touching X turns into X. FIRE EATS PLANT is a wildfire.',
    MAKES: 'X MAKES Y: X keeps producing Y in the empty space beside it.',
    HAS: 'X HAS Y: when X is destroyed it leaves Y behind.',
    AND: 'Joins words on either side: SAND AND ICE IS HOT AND FLOATY.',
    NOT: 'Cancels: SAND IS NOT HEAVY. X EATS NOT Y eats everything except Y.',
    YOU: 'Moves with the arrow keys or WASD. HEAVY things cannot climb.',
    WIN: 'Touch it with whatever IS YOU.',
    HEAVY: 'Falls and sinks through lighter stuff.',
    FLOATY: 'Rises. HEAVY and FLOATY cancel out.',
    FLUID: 'Spreads sideways like a liquid. On its own it drifts like a gas.',
    STILL: 'Never moves, whatever else is true.',
    HOT: 'Destroys anything that IS MELT. Sets off BOOM.',
    COLD: 'Puts out anything HOT that it touches.',
    MELT: 'Destroyed on contact with anything HOT.',
    BRIEF: 'Vanishes after a second or two.',
    BOOM: 'Explodes into fire when it touches anything HOT.',
    SINK: 'Destroys whatever it touches, and itself.',
  };
  const kind = (w) => (w.type === 'noun' ? 'noun' : w.type === 'prop' ? 'prop' : w.key === 'NOT' ? 'op not' : 'op');

  // ------------------------------------------------------------------ sound
  const sfx = (() => {
    let ac = null;
    let on = store.get('sound', true);
    let lastBoom = 0, lastHiss = 0;
    const ctx = () => {
      if (!on) return null;
      if (!ac) {
        try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
      }
      if (ac.state === 'suspended') ac.resume();
      return ac;
    };
    function tone(freq, dur, vol, slide, delay, type) {
      const a = ctx();
      if (!a) return;
      const t = a.currentTime + (delay || 0);
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(a.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    }
    function noise(dur, vol, cutoff) {
      const a = ctx();
      if (!a) return;
      const len = Math.floor(a.sampleRate * dur);
      const buf = a.createBuffer(1, len, a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      const src = a.createBufferSource();
      src.buffer = buf;
      const f = a.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = cutoff;
      const g = a.createGain();
      g.gain.value = vol;
      src.connect(f).connect(g).connect(a.destination);
      src.start();
    }
    return {
      get on() { return on; },
      toggle() { on = !on; store.set('sound', on); return on; },
      pick() { tone(660, 0.05, 0.025); },
      drop() { tone(392, 0.07, 0.035); },
      remove() { tone(300, 0.09, 0.03, 0.55); },
      lawOn() { tone(523, 0.08, 0.04); tone(784, 0.16, 0.04, 1, 0.07); },
      lawOff() { tone(415, 0.08, 0.035); tone(262, 0.18, 0.035, 1, 0.07); },
      boom() {
        const now = performance.now();
        if (now - lastBoom < 140) return;
        lastBoom = now;
        noise(0.7, 0.5, 500);
        tone(90, 0.5, 0.12, 0.4, 0, 'sine');
      },
      hiss() {
        const now = performance.now();
        if (now - lastHiss < 300) return;
        lastHiss = now;
        noise(0.18, 0.05, 5000);
      },
      win() { [523, 659, 784, 1047, 1319].forEach((f, k) => tone(f, 0.2, 0.045, 1, k * 0.085)); },
    };
  })();

  // ------------------------------------------------------------------ world
  const world = new S.World((Math.random() * 4294967295) >>> 0);
  const cvs = $('world');
  const ctx = cvs.getContext('2d');
  const CW = cvs.width, CH = cvs.height;
  const buf = document.createElement('canvas');
  buf.width = W; buf.height = H;
  const bctx = buf.getContext('2d');
  const img = bctx.createImageData(W, H);
  const glow = document.createElement('canvas');
  glow.width = W; glow.height = H;
  const gctx = glow.getContext('2d');
  const gimg = gctx.createImageData(W, H);
  const filterOK = (() => {
    try { ctx.filter = 'blur(2px)'; const ok = ctx.filter === 'blur(2px)'; ctx.filter = 'none'; return ok; } catch (e) { return false; }
  })();

  // Background: deep ink with a faint dot grid and a soft vertical falloff.
  const BG = new Uint8Array(N * 3);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3;
      const t = y / H;
      let r = 22 - 10 * t, g = 18 - 8 * t, b = 36 - 14 * t;
      if (x % 6 === 0 && y % 6 === 0) { r += 10; g += 9; b += 16; }
      BG[i] = r; BG[i + 1] = g; BG[i + 2] = b;
    }
  }
  const BASE = MATS.map((m) => m.rgb);
  const VARY = MATS.map((m) => m.vary);

  let shake = 0, flash = 0;
  const confetti = [];

  function draw(time) {
    const mat = world.mat, life = world.life, shade = world.shade, props = world.rules.props;
    const d = img.data, gd = gimg.data;
    const pulse = 0.5 + 0.5 * Math.sin(time / 170);
    const glowMask = world.rules.any & (P.HOT | P.WIN | P.YOU);
    for (let i = 0, j = 0, k = 0; i < N; i++, j += 4, k += 3) {
      const m = mat[i];
      if (m === 0) {
        d[j] = BG[k]; d[j + 1] = BG[k + 1]; d[j + 2] = BG[k + 2]; d[j + 3] = 255;
        gd[j + 3] = 0;
        continue;
      }
      const p = props[m];
      const s = shade[i];
      const v = (VARY[m] * (s - 128)) / 128;
      const base = BASE[m];
      let r = base[0] + v, g = base[1] + v, b = base[2] + v;
      if (m === MAT.WATER) {
        const x = i % W, y = (i / W) | 0;
        const w = Math.sin(time * 0.003 + x * 0.33 + y * 0.55) * 12;
        r += w * 0.3; g += w * 0.6; b += w;
      } else if (m === MAT.FIRE) {
        const l = life[i];
        const t = l ? Math.min(1, l / 90) : 0.35 + 0.65 * Math.abs(Math.sin(time * 0.012 + s));
        r = 255; g = 70 + 160 * t + v * 0.4; b = 20 + 70 * t * t;
      } else if (m === MAT.SMOKE) {
        const l = life[i];
        const a = l ? Math.min(1, l / 70) * 0.85 : 0.85;
        r = BG[k] + (r - BG[k]) * a; g = BG[k + 1] + (g - BG[k + 1]) * a; b = BG[k + 2] + (b - BG[k + 2]) * a;
      } else if (m === MAT.LAVA) {
        const f = Math.sin(time * 0.004 + s * 0.09) * 26;
        r = 255; g = 72 + f + v * 0.5; b = 28 + f * 0.3;
      } else if (m === MAT.FLAG) {
        if ((s * 13 + ((time / 70) | 0)) % 89 === 0) { r = 255; g = 250; b = 220; }
      } else if (m === MAT.ICE) {
        if ((s * 7 + ((time / 120) | 0)) % 131 === 0) { r = 245; g = 252; b = 255; }
      }
      if (p & P.YOU) {
        r += 34 * pulse; g -= 6 * pulse; b += 22 * pulse;
      }
      d[j] = r; d[j + 1] = g; d[j + 2] = b; d[j + 3] = 255;
      if (glowMask) {
        if (p & P.HOT) { gd[j] = 255; gd[j + 1] = 110; gd[j + 2] = 40; gd[j + 3] = 255; }
        else if (p & P.WIN) { gd[j] = 255; gd[j + 1] = 205; gd[j + 2] = 60; gd[j + 3] = 150; }
        else if (p & P.YOU) { gd[j] = 255; gd[j + 1] = 90; gd[j + 2] = 170; gd[j + 3] = 60 + 70 * pulse; }
        else gd[j + 3] = 0;
      }
    }
    bctx.putImageData(img, 0, 0);

    ctx.save();
    if (shake > 0.3 && !reduceMotion) ctx.translate((Math.random() - 0.5) * shake * 2, (Math.random() - 0.5) * shake * 2);
    shake *= 0.86;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(buf, 0, 0, CW, CH);
    if (glowMask) {
      gctx.putImageData(gimg, 0, 0);
      ctx.globalCompositeOperation = 'lighter';
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = 0.5;
      if (filterOK) ctx.filter = 'blur(6px)';
      ctx.drawImage(glow, 0, 0, CW, CH);
      if (filterOK) ctx.filter = 'none';
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();

    if (flash > 0.02 && !reduceMotion) {
      ctx.fillStyle = 'rgba(255,220,180,' + flash.toFixed(3) + ')';
      ctx.fillRect(0, 0, CW, CH);
    }
    flash *= 0.82;

    if (confetti.length) {
      for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i];
        c.x += c.vx; c.y += c.vy; c.vy += 0.18; c.vx *= 0.99; c.life--;
        if (c.life <= 0 || c.y > CH + 10) { confetti.splice(i, 1); continue; }
        ctx.fillStyle = c.c;
        ctx.fillRect(c.x, c.y, c.s, c.s);
      }
    }

    if (cursor.inside && state.mode === 'sandbox') {
      const sx = CW / W;
      ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc((cursor.gx + 0.5) * sx, (cursor.gy + 0.5) * sx, (brushSize + 0.5) * sx, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function burst(gx, gy, n) {
    const sx = CW / W;
    const cols = ['#ffd23f', '#ff6fae', '#6fe3ff', '#5fd17a', '#ffffff'];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * 7;
      confetti.push({
        x: gx * sx, y: gy * sx, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4,
        c: cols[i % cols.length], s: 3 + Math.random() * 4, life: 70 + Math.random() * 60,
      });
    }
  }

  // ------------------------------------------------------------------ state
  let uid = 1;
  const tile = (w, locked) => ({ w, locked: !!locked, uid: uid++ });
  const state = {
    mode: 'sandbox',
    rows: [],
    bank: [],
    focusRow: null,
    undo: [],
    level: 0,
    won: false,
    paused: false,
    speed: 1,
  };
  let lastActive = new Set();
  let sandboxSave = null;
  const solved = new Set(store.get('solved', []));

  const rowsFromKeys = (rows, locked) => rows.map((r) => r.map((k) => tile(WID[k], locked)));
  const ids = () => state.rows.map((r) => r.map((t) => t.w));

  function snapshotBoard() {
    return { rows: state.rows.map((r) => r.map((t) => ({ ...t }))), bank: state.bank.map((t) => ({ ...t })) };
  }
  function pushUndo() {
    state.undo.push(snapshotBoard());
    if (state.undo.length > 120) state.undo.shift();
    $('btn-undo').disabled = false;
  }
  function undo() {
    const s = state.undo.pop();
    if (!s) return;
    state.rows = s.rows;
    state.bank = s.bank;
    state.focusRow = null;
    sfx.remove();
    commit();
    renderPalette();
    $('btn-undo').disabled = !state.undo.length;
  }

  // Re-read the board, push the new laws into the world, redraw the board.
  function commit(opts) {
    opts = opts || {};
    state.rows = state.rows.filter((r) => r.length);
    if (state.focusRow && state.rows.indexOf(state.focusRow) < 0) state.focusRow = null;
    const res = S.compileBoard(ids());
    const texts = res.valid.map((s) => (s ? S.sentenceText(s) : null));
    const now = new Set(texts.filter(Boolean));
    const added = [...now].filter((t) => !lastActive.has(t));
    const removed = [...lastActive].filter((t) => !now.has(t));
    lastActive = now;
    world.setRules(res.rules);
    if (state.mode === 'sandbox' && !$('coach').hidden && added.some((t) => /^SAND IS (.* )?FLOATY/.test(t))) {
      hideCoach();
      toast('Sand falls up now. Every law here works like that.');
    }
    renderBoard(res.valid, texts, opts.silent ? [] : added);
    if (!opts.silent) {
      if (added.length) sfx.lawOn();
      else if (removed.length) sfx.lawOff();
    }
    if (state.mode === 'sandbox') store.set('code', S.encodeRows(ids()));
    updateYouUI();
  }

  // ------------------------------------------------------------- board DOM
  function tileEl(t, where, row, idx) {
    const w = WORDS[t.w];
    const el = document.createElement('div');
    el.className = 'tile ' + kind(w) + (t.locked ? ' locked' : '');
    el.textContent = w.key;
    el.style.setProperty('--c', COLOR[w.key] || '#fff');
    el.dataset.where = where;
    el.dataset.w = t.w;
    if (row != null) el.dataset.row = row;
    if (idx != null) el.dataset.idx = idx;
    if (!t.locked) {
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', where === 'board' ? 'Remove ' + w.key : 'Add ' + w.key);
    } else {
      el.title = 'Locked';
    }
    return el;
  }

  function renderBoard(valid, texts, added) {
    const board = $('board');
    board.textContent = '';
    state.rows.forEach((row, ri) => {
      const el = document.createElement('div');
      el.className = 'row ' + (valid[ri] ? 'active' : 'inactive') + (row === state.focusRow ? ' focus' : '');
      el.dataset.row = ri;
      el.title = valid[ri] ? 'In force: ' + texts[ri] : 'Not a sentence yet';
      row.forEach((t, ti) => el.appendChild(tileEl(t, 'board', ri, ti)));
      if (valid[ri] && added.indexOf(texts[ri]) >= 0 && !reduceMotion) el.classList.add('flash');
      board.appendChild(el);
    });
    const nr = document.createElement('div');
    nr.className = 'row new' + (state.focusRow ? '' : ' focus');
    nr.dataset.row = 'new';
    nr.textContent = 'Drop or tap words here to start a new law';
    board.appendChild(nr);
    const n = valid.filter(Boolean).length;
    $('law-count').textContent = n + ' in force';
  }

  function renderPalette() {
    const pal = $('palette');
    pal.textContent = '';
    const group = (title, list, where) => {
      const g = document.createElement('div');
      const h = document.createElement('h3');
      h.textContent = title;
      const box = document.createElement('div');
      box.className = 'tiles';
      list.forEach((t, i) => box.appendChild(tileEl(t, where, null, i)));
      g.append(h, box);
      pal.appendChild(g);
      return box;
    };
    if (state.mode === 'sandbox') {
      const byType = (f) => WORDS.filter(f).map((w) => ({ w: w.id, uid: 0 }));
      group('Things', byType((w) => w.type === 'noun'), 'palette');
      group('Verbs and joins', byType((w) => w.type === 'verb' || w.type === 'and' || w.type === 'not'), 'palette');
      group('Properties', byType((w) => w.type === 'prop'), 'palette');
    } else {
      const box = group('Loose words', state.bank, 'bank');
      if (!state.bank.length) {
        const p = document.createElement('p');
        p.className = 'empty';
        p.textContent = state.won || !L.LEVELS[state.level].words.length
          ? 'No loose words in this level.'
          : 'Every loose word is on the board. Tap one there to take it back.';
        box.replaceWith(p);
      }
    }
  }

  function showInfo(wid) {
    const w = WORDS[wid];
    $('info').innerHTML = '<b>' + w.key + '</b> ' + INFO[w.key];
  }

  // ----------------------------------------------------------- drag & drop
  let drag = null;

  document.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    const el = e.target.closest && e.target.closest('.tile');
    if (!el || el.classList.contains('locked') || !el.closest('#board, #palette')) return;
    drag = {
      el, where: el.dataset.where, row: +el.dataset.row, idx: +el.dataset.idx, w: +el.dataset.w,
      x0: e.clientX, y0: e.clientY, moved: false, id: e.pointerId, target: null, ghost: null,
    };
    e.preventDefault();
  });

  window.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
      drag.moved = true;
      drag.ghost = drag.el.cloneNode(true);
      drag.ghost.classList.add('ghost');
      document.body.appendChild(drag.ghost);
      if (drag.where !== 'palette') drag.el.classList.add('lifted');
      document.body.classList.add('dragging');
      showInfo(drag.w);
      sfx.pick();
    }
    drag.ghost.style.left = e.clientX + 'px';
    drag.ghost.style.top = e.clientY + 'px';
    findTarget(e.clientX, e.clientY);
  });

  function clearMarks() {
    document.querySelectorAll('.caret').forEach((c) => c.remove());
    document.querySelectorAll('.drop-target').forEach((c) => c.classList.remove('drop-target'));
    $('palette').classList.remove('drop-remove');
  }

  function findTarget(x, y) {
    clearMarks();
    const hit = document.elementFromPoint(x, y);
    const rowEl = hit && hit.closest && hit.closest('#board .row');
    if (!rowEl) {
      drag.target = null;
      if (drag.where !== 'palette') $('palette').classList.add('drop-remove');
      return;
    }
    if (rowEl.dataset.row === 'new') {
      rowEl.classList.add('drop-target');
      drag.target = { row: -1, idx: 0 };
      return;
    }
    const tiles = [...rowEl.querySelectorAll('.tile')];
    let idx = tiles.length;
    for (let k = 0; k < tiles.length; k++) {
      const r = tiles[k].getBoundingClientRect();
      if (y < r.top - 4 || (y <= r.bottom + 4 && x < r.left + r.width / 2)) { idx = k; break; }
    }
    drag.target = { row: +rowEl.dataset.row, idx };
    const rr = rowEl.getBoundingClientRect();
    const caret = document.createElement('div');
    caret.className = 'caret';
    let left, top, height = 28;
    if (idx < tiles.length) {
      const r = tiles[idx].getBoundingClientRect();
      left = r.left - rr.left - 4; top = r.top - rr.top; height = r.height;
    } else if (tiles.length) {
      const r = tiles[tiles.length - 1].getBoundingClientRect();
      left = r.right - rr.left + 1; top = r.top - rr.top; height = r.height;
    } else {
      left = 20; top = 6;
    }
    caret.style.left = left + 'px';
    caret.style.top = top + 'px';
    caret.style.height = height + 'px';
    rowEl.appendChild(caret);
  }

  function takeSource(d) {
    if (d.where === 'board') return state.rows[d.row].splice(d.idx, 1)[0];
    if (d.where === 'bank') return state.bank.splice(d.idx, 1)[0];
    return tile(d.w);
  }

  function endDrag(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    clearMarks();
    document.body.classList.remove('dragging');
    if (d.ghost) d.ghost.remove();
    d.el.classList.remove('lifted');
    if (cancelled) return;
    if (d.moved) dropTile(d);
    else tapTile(d);
  }
  window.addEventListener('pointerup', (e) => endDrag(e, false));
  window.addEventListener('pointercancel', (e) => endDrag(e, true));

  function dropTile(d) {
    const tg = d.target;
    if (!tg && d.where === 'palette') return;
    pushUndo();
    const t = takeSource(d);
    if (tg) {
      if (tg.row === -1) {
        const r = [t];
        state.rows.push(r);
        state.focusRow = r;
      } else {
        const row = state.rows[tg.row];
        let idx = tg.idx;
        if (d.where === 'board' && d.row === tg.row && d.idx < idx) idx--;
        row.splice(idx, 0, t);
        state.focusRow = row;
      }
      sfx.drop();
    } else {
      if (state.mode === 'puzzle') state.bank.push(t);
      sfx.remove();
    }
    commit();
    renderPalette();
  }

  function tapTile(d) {
    pushUndo();
    if (d.where === 'board') {
      const row = state.rows[d.row];
      const t = row.splice(d.idx, 1)[0];
      if (state.mode === 'puzzle') state.bank.push(t);
      state.focusRow = row.length ? row : null;
      sfx.remove();
    } else {
      const t = takeSource(d);
      if (state.focusRow && state.rows.indexOf(state.focusRow) >= 0) state.focusRow.push(t);
      else {
        const r = [t];
        state.rows.push(r);
        state.focusRow = r;
      }
      sfx.drop();
    }
    commit();
    renderPalette();
    showInfo(d.w);
  }

  $('board').addEventListener('click', (e) => {
    if (e.target.closest('.tile')) return;
    const rowEl = e.target.closest('.row');
    if (!rowEl) return;
    state.focusRow = rowEl.dataset.row === 'new' ? null : state.rows[+rowEl.dataset.row];
    commit({ silent: true });
  });

  document.addEventListener('keydown', (e) => {
    const el = e.target.closest && e.target.closest('.tile');
    if (!el || el.classList.contains('locked') || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    e.stopPropagation();
    tapTile({ where: el.dataset.where, row: +el.dataset.row, idx: +el.dataset.idx, w: +el.dataset.w });
  }, true);

  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest && e.target.closest('.tile');
    if (el && !drag) showInfo(+el.dataset.w);
  });
  document.addEventListener('focusin', (e) => {
    const el = e.target.closest && e.target.closest('.tile');
    if (el) showInfo(+el.dataset.w);
  });

  // --------------------------------------------------------------- painting
  const BRUSHES = [MAT.SAND, MAT.WATER, MAT.STONE, MAT.FIRE, MAT.PLANT, MAT.LAVA, MAT.ICE, MAT.OIL, MAT.SMOKE, MAT.FLAG, 0];
  const SOLID = new Set([MAT.STONE, MAT.PLANT, MAT.ICE, MAT.FLAG]);
  let brush = MAT.SAND;
  let brushSize = 4;
  const cursor = { inside: false, gx: 0, gy: 0 };
  let paint = null;

  function renderBrushes() {
    const box = $('brushes');
    box.textContent = '';
    BRUSHES.forEach((m, k) => {
      const b = document.createElement('button');
      b.className = 'brush' + (m === 0 ? ' eraser' : '');
      const name = m === 0 ? 'ERASE' : MATS[m].key;
      b.style.setProperty('--c', m === 0 ? '#8d86a8' : COLOR[name]);
      b.innerHTML = '<i></i>' + name + (k < 10 ? ' <span class="key">' + ((k + 1) % 10) + '</span>' : '');
      b.setAttribute('aria-pressed', String(m === brush));
      b.addEventListener('click', () => { brush = m; renderBrushes(); });
      box.appendChild(b);
    });
  }

  function gridPos(e) {
    const r = cvs.getBoundingClientRect();
    return {
      gx: Math.floor(((e.clientX - r.left) / r.width) * W),
      gy: Math.floor(((e.clientY - r.top) / r.height) * H),
    };
  }

  function stamp(gx, gy, erase) {
    const r = brushSize;
    const m = erase ? 0 : brush;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r + r) continue;
        const x = gx + dx, y = gy + dy;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const i = y * W + x;
        if (m === 0) { if (world.mat[i]) world.set(i, 0); continue; }
        if (world.mat[i] !== 0) continue;
        if (SOLID.has(m) || Math.random() < 0.45) world.set(i, m);
      }
    }
  }

  function strokeTo(gx, gy) {
    const steps = Math.max(Math.abs(gx - paint.gx), Math.abs(gy - paint.gy), 1);
    for (let s = 1; s <= steps; s++) {
      stamp(Math.round(paint.gx + ((gx - paint.gx) * s) / steps), Math.round(paint.gy + ((gy - paint.gy) * s) / steps), paint.erase);
    }
    paint.gx = gx; paint.gy = gy;
  }

  cvs.addEventListener('pointerdown', (e) => {
    if (state.mode !== 'sandbox') return;
    const g = gridPos(e);
    paint = { gx: g.gx, gy: g.gy, erase: e.button === 2 || brush === 0, id: e.pointerId };
    try { cvs.setPointerCapture(e.pointerId); } catch (err) { /* capture unsupported */ }
    stamp(g.gx, g.gy, paint.erase);
    hideCoachSoon();
  });
  cvs.addEventListener('pointermove', (e) => {
    const g = gridPos(e);
    cursor.inside = e.pointerType === 'mouse';
    cursor.gx = g.gx; cursor.gy = g.gy;
    if (paint && e.pointerId === paint.id) strokeTo(g.gx, g.gy);
  });
  const stopPaint = () => { paint = null; };
  cvs.addEventListener('pointerup', stopPaint);
  cvs.addEventListener('pointercancel', stopPaint);
  cvs.addEventListener('pointerleave', () => { cursor.inside = false; });
  cvs.addEventListener('contextmenu', (e) => e.preventDefault());

  $('brush-size').addEventListener('input', (e) => {
    brushSize = +e.target.value;
    $('brush-out').textContent = brushSize;
  });

  // ------------------------------------------------------------------ input
  const keys = new Set();
  const pad = new Set();
  const KEYMAP = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    a: 'left', d: 'right', w: 'up', s: 'down', A: 'left', D: 'right', W: 'up', S: 'down',
  };
  const typing = (e) => e.target && (e.target.tagName === 'INPUT' && e.target.type === 'text');
  const modalOpen = () => document.querySelector('.modal:not([hidden])');

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModals(); return; }
    if (typing(e)) return;
    if (modalOpen()) return;
    const dir = KEYMAP[e.key];
    if (dir && !(e.target.type === 'range' && dir)) {
      keys.add(dir);
      if (e.key.startsWith('Arrow')) e.preventDefault();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === ' ' && !(e.target.closest && e.target.closest('button, .tile'))) { e.preventDefault(); togglePause(); }
    else if (e.key === '.') stepOnce();
    else if (e.key === 'r' || e.key === 'R') { if (state.mode === 'puzzle') loadLevel(state.level); }
    else if (e.key === 'm' || e.key === 'M') toggleSound();
    else if (e.key === '?') openModal('modal-help');
    else if (e.key === '[') setBrushSize(brushSize - 1);
    else if (e.key === ']') setBrushSize(brushSize + 1);
    else if (/^[0-9]$/.test(e.key) && state.mode === 'sandbox') {
      const k = e.key === '0' ? 9 : +e.key - 1;
      brush = BRUSHES[k];
      renderBrushes();
    }
  });
  window.addEventListener('keyup', (e) => {
    const dir = KEYMAP[e.key];
    if (dir) keys.delete(dir);
  });
  window.addEventListener('blur', () => { keys.clear(); pad.clear(); });

  function setBrushSize(n) {
    brushSize = Math.max(1, Math.min(12, n));
    $('brush-size').value = brushSize;
    $('brush-out').textContent = brushSize;
  }

  $('dpad').querySelectorAll('button').forEach((b) => {
    const dir = b.dataset.dir;
    const on = (e) => { e.preventDefault(); pad.add(dir); b.classList.add('on'); };
    const off = () => { pad.delete(dir); b.classList.remove('on'); };
    b.addEventListener('pointerdown', on);
    b.addEventListener('pointerup', off);
    b.addEventListener('pointercancel', off);
    b.addEventListener('pointerleave', off);
  });

  function readInput() {
    const held = (d) => keys.has(d) || pad.has(d);
    world.input.dx = (held('right') ? 1 : 0) - (held('left') ? 1 : 0);
    world.input.dy = (held('down') ? 1 : 0) - (held('up') ? 1 : 0);
  }

  // ----------------------------------------------------------------- YOU UI
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  let youHintShown = false;
  function updateYouUI() {
    const hasYou = !!(world.rules.any & P.YOU);
    $('dpad').hidden = !(hasYou && (coarse || window.innerWidth < 760));
    if (state.mode === 'sandbox' && hasYou && !youHintShown) {
      youHintShown = true;
      toast('Something IS YOU now. Steer it with the arrow keys or WASD.');
    }
  }

  let bannerText = '';
  function setBanner(text) {
    if (text === bannerText) return;
    bannerText = text;
    $('banner').hidden = !text;
    $('banner').textContent = text;
  }

  function checkBanner() {
    if (state.mode !== 'puzzle' || state.won) { setBanner(''); return; }
    const R = world.rules;
    if (!(R.any & P.YOU)) { setBanner('Nothing IS YOU right now. Undo, or press R to restart.'); return; }
    let you = false, winning = false;
    for (let m = 1; m < S.NM; m++) {
      if (R.props[m] & P.YOU && world.count(m)) you = true;
      if (R.props[m] & P.WIN && world.count(m)) winning = true;
    }
    if (!you) setBanner('Whatever IS YOU is gone. Press R to restart.');
    else if (!(R.any & P.WIN) || !winning) setBanner('Nothing in this world IS WIN yet.');
    else setBanner('');
  }

  // ------------------------------------------------------------------ toast
  let toastTimer = 0;
  function toast(text) {
    const t = $('toast');
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
  }

  // ------------------------------------------------------------------- loop
  let acc = 0;
  let frame = 0;
  let sandboxWinCooldown = 0;

  function handleEvents() {
    for (const ev of world.events) {
      if (ev.type === 'boom') { shake = Math.min(12, shake + 5); flash = Math.min(0.35, flash + 0.12); sfx.boom(); }
      else if (ev.type === 'hiss') sfx.hiss();
      else if (ev.type === 'win') onWin(ev);
    }
  }

  function stepOnce() {
    readInput();
    world.tick();
    handleEvents();
  }

  function loop(time) {
    readInput();
    if (!state.paused) {
      acc += state.speed;
      let n = 0;
      while (acc >= 1 && n < 6) {
        world.tick();
        handleEvents();
        acc -= 1;
        n++;
      }
    }
    if (paint) stamp(paint.gx, paint.gy, paint.erase);
    if (sandboxWinCooldown > 0 && --sandboxWinCooldown === 0) world.won = false;
    if (++frame % 20 === 0) checkBanner();
    draw(time);
    requestAnimationFrame(loop);
  }

  function togglePause() {
    state.paused = !state.paused;
    $('btn-play').textContent = state.paused ? 'Play' : 'Pause';
  }

  // ---------------------------------------------------------------- puzzles
  function onWin(ev) {
    burst(ev.x, ev.y, 140);
    sfx.win();
    if (state.mode === 'sandbox') {
      toast('WIN. Something that IS YOU touched something that IS WIN.');
      sandboxWinCooldown = 180;
      return;
    }
    if (state.won) return;
    state.won = true;
    const lv = L.LEVELS[state.level];
    solved.add(lv.id);
    store.set('solved', [...solved]);
    updateProgress();
    const last = state.level === L.LEVELS.length - 1;
    const allDone = solved.size === L.LEVELS.length;
    $('win-text').textContent = last || allDone
      ? (allDone ? 'Every level solved. The sandbox is yours now: no locks, every word.' : lv.name + ' solved.')
      : lv.name + ' solved. ' + (L.LEVELS.length - solved.size) + ' to go.';
    $('btn-next').textContent = last ? 'Open the sandbox' : 'Next level';
    $('win').hidden = false;
    setBanner('');
  }

  function loadLevel(n) {
    const lv = L.LEVELS[n];
    state.level = n;
    state.won = false;
    world.won = false;
    world.input.dx = world.input.dy = 0;
    L.buildLevel(world, lv);
    state.rows = rowsFromKeys(lv.rules, true);
    state.bank = lv.words.map((k) => tile(WID[k]));
    state.undo = [];
    state.focusRow = null;
    lastActive = new Set();
    $('btn-undo').disabled = true;
    $('win').hidden = true;
    commit({ silent: true });
    renderPalette();
    $('level-num').textContent = String(n + 1).padStart(2, '0');
    $('level-name').textContent = lv.name;
    $('level-hint').textContent = lv.hint;
    $('hud').textContent = String(n + 1).padStart(2, '0') + '  ' + lv.name.toUpperCase();
    $('hud').hidden = false;
    $('info').textContent = 'Drag a loose word into a law, or tap it to add it to the highlighted law. Tap a placed word to take it back.';
    store.set('level', n);
    bannerText = null;
    checkBanner();
  }

  function updateProgress() {
    $('puzzle-progress').textContent = solved.size + '/' + L.LEVELS.length;
  }

  function renderLevelGrid() {
    const grid = $('level-grid');
    grid.textContent = '';
    L.LEVELS.forEach((lv, i) => {
      const b = document.createElement('button');
      b.className = 'level-card' + (solved.has(lv.id) ? ' solved' : '') + (state.mode === 'puzzle' && i === state.level ? ' current' : '');
      b.innerHTML = '<b>' + String(i + 1).padStart(2, '0') + '</b><span></span>';
      b.querySelector('span').textContent = lv.name;
      b.addEventListener('click', () => {
        closeModals();
        if (state.mode !== 'puzzle') enterPuzzles(i);
        else loadLevel(i);
      });
      grid.appendChild(b);
    });
  }

  // ------------------------------------------------------------------ modes
  function setModeUI() {
    const pz = state.mode === 'puzzle';
    document.body.classList.toggle('puzzle', pz);
    $('tab-sandbox').setAttribute('aria-selected', String(!pz));
    $('tab-puzzles').setAttribute('aria-selected', String(pz));
    $('dock-sandbox').hidden = pz;
    $('dock-puzzle').hidden = !pz;
    $('recipes').hidden = pz;
    $('btn-share').hidden = pz;
    $('btn-reset-rules').hidden = pz;
    $('hud').hidden = !pz;
    if (!pz) $('win').hidden = true;
    if (pz) $('coach').hidden = true;
  }

  function enterPuzzles(n) {
    if (state.mode === 'sandbox') {
      sandboxSave = {
        rows: snapshotBoard().rows,
        mat: world.mat.slice(), life: world.life.slice(), shade: world.shade.slice(),
      };
    }
    state.mode = 'puzzle';
    state.paused = false;
    $('btn-play').textContent = 'Pause';
    setModeUI();
    if (n == null) {
      const first = L.LEVELS.findIndex((lv) => !solved.has(lv.id));
      n = first < 0 ? store.get('level', 0) : first;
    }
    loadLevel(Math.max(0, Math.min(L.LEVELS.length - 1, n)));
  }

  function enterSandbox() {
    state.mode = 'sandbox';
    state.won = false;
    world.won = false;
    state.bank = [];
    state.undo = [];
    $('btn-undo').disabled = true;
    if (sandboxSave) {
      state.rows = sandboxSave.rows;
      world.mat.set(sandboxSave.mat);
      world.life.set(sandboxSave.life);
      world.shade.set(sandboxSave.shade);
    } else {
      L.buildSandbox(world);
    }
    state.focusRow = null;
    lastActive = new Set();
    setModeUI();
    setBanner('');
    commit({ silent: true });
    renderPalette();
  }

  // ---------------------------------------------------------------- recipes
  function renderRecipes() {
    const box = $('chips');
    box.textContent = '';
    L.RECIPES.forEach((rc) => {
      const b = document.createElement('button');
      b.className = 'chip';
      b.textContent = rc.name;
      b.title = rc.add.map((r) => r.join(' ')).join(' / ');
      b.addEventListener('click', () => {
        pushUndo();
        for (const r of rc.add) state.rows.push(r.map((k) => tile(WID[k])));
        state.focusRow = null;
        commit();
        toast(rc.note);
      });
      box.appendChild(b);
    });
  }

  // ----------------------------------------------------------------- modals
  function openModal(id) {
    closeModals();
    if (id === 'modal-levels') renderLevelGrid();
    $(id).hidden = false;
    const f = $(id).querySelector('.close');
    if (f) f.focus();
  }
  function closeModals() {
    document.querySelectorAll('.modal').forEach((m) => { m.hidden = true; });
  }
  document.querySelectorAll('.modal').forEach((m) => {
    m.addEventListener('click', (e) => {
      if (e.target === m || e.target.closest('[data-close]')) closeModals();
    });
  });

  function renderGlossary() {
    const box = $('glossary');
    WORDS.forEach((w) => {
      const row = document.createElement('div');
      row.className = 'gloss';
      const tag = document.createElement('span');
      tag.className = 'mini ' + kind(w);
      tag.style.setProperty('--c', COLOR[w.key] || '#fff');
      tag.textContent = w.key;
      const txt = document.createElement('span');
      txt.textContent = INFO[w.key];
      row.append(tag, txt);
      box.appendChild(row);
    });
  }

  const embedded = (() => { try { return window.top !== window.self; } catch (e) { return true; } })();
  function openShare() {
    const code = S.encodeRows(ids());
    $('share-code').value = code;
    $('share-status').textContent = '';
    if (!embedded && /^https?:/.test(location.protocol)) {
      const link = location.origin + location.pathname + '#' + code;
      $('share-link').href = link;
      $('share-link').textContent = link;
      $('share-link-wrap').hidden = false;
    } else {
      $('share-link-wrap').hidden = true;
    }
    openModal('modal-share');
    $('share-code').select();
  }

  function loadCode(code) {
    const rows = S.decodeRows(code);
    if (!rows) return false;
    pushUndo();
    state.rows = rows.map((r) => r.map((id) => tile(id)));
    state.focusRow = null;
    commit();
    return true;
  }

  // ---------------------------------------------------------------- buttons
  function toggleSound() {
    const on = sfx.toggle();
    $('btn-sound').setAttribute('aria-pressed', String(on));
  }

  $('tab-sandbox').addEventListener('click', () => { if (state.mode !== 'sandbox') enterSandbox(); });
  $('tab-puzzles').addEventListener('click', () => { if (state.mode !== 'puzzle') enterPuzzles(); });
  $('btn-help').addEventListener('click', () => openModal('modal-help'));
  $('btn-sound').addEventListener('click', toggleSound);
  $('btn-play').addEventListener('click', togglePause);
  $('btn-step').addEventListener('click', () => { if (!state.paused) togglePause(); stepOnce(); });
  $('btn-speed').addEventListener('click', () => {
    const speeds = [1, 2, 4, 0.5];
    state.speed = speeds[(speeds.indexOf(state.speed) + 1) % speeds.length];
    $('btn-speed').textContent = (state.speed === 0.5 ? '½' : state.speed) + '×';
  });
  $('btn-new-world').addEventListener('click', () => { L.buildSandbox(world); toast('A fresh world. Same laws.'); });
  $('btn-clear').addEventListener('click', () => { world.clear(); toast('Emptied. Paint something.'); });
  $('btn-undo').addEventListener('click', undo);
  $('btn-reset-rules').addEventListener('click', () => {
    pushUndo();
    state.rows = rowsFromKeys(L.DEFAULT_RULES, false);
    state.focusRow = null;
    commit();
    toast('Back to the default laws. Undo brings yours back.');
  });
  $('btn-share').addEventListener('click', openShare);
  $('btn-copy').addEventListener('click', () => {
    const code = $('share-code').value;
    const done = () => { $('share-status').textContent = 'Copied.'; };
    const fallback = () => { $('share-code').select(); $('share-status').textContent = 'Press Ctrl+C (or Cmd+C) to copy the selected code.'; };
    try {
      navigator.clipboard.writeText(code).then(done, fallback);
    } catch (e) { fallback(); }
  });
  $('btn-load').addEventListener('click', () => {
    const ok = loadCode($('load-code').value);
    $('share-status').textContent = ok ? 'Loaded.' : 'That is not a law code. Codes start with r_.';
    if (ok) setTimeout(closeModals, 500);
  });
  $('load-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('btn-load').click(); });
  $('btn-restart').addEventListener('click', () => loadLevel(state.level));
  $('btn-levels').addEventListener('click', () => openModal('modal-levels'));
  $('btn-replay').addEventListener('click', () => loadLevel(state.level));
  $('btn-next').addEventListener('click', () => {
    if (state.level === L.LEVELS.length - 1) enterSandbox();
    else loadLevel(state.level + 1);
  });

  let coachTimer = 0;
  function hideCoach() { $('coach').hidden = true; store.set('coached', true); }
  function hideCoachSoon() { if (!$('coach').hidden) { clearTimeout(coachTimer); coachTimer = setTimeout(hideCoach, 4000); } }
  $('btn-coach').addEventListener('click', hideCoach);

  // ------------------------------------------------------------------- boot
  function boot(data) {
    renderBrushes();
    renderRecipes();
    renderGlossary();
    updateProgress();
    $('btn-sound').setAttribute('aria-pressed', String(sfx.on));
    $('btn-undo').disabled = true;

    const hash = location.hash && S.decodeRows(location.hash);
    const saved = data.code ? S.decodeRows(data.code) : store.get('code', null) && S.decodeRows(store.get('code', ''));
    const rows = hash || saved;
    state.rows = rows && rows.length ? rows.map((r) => r.map((id) => tile(id))) : rowsFromKeys(L.DEFAULT_RULES, false);
    L.buildSandbox(world);
    if (data.mode === 'puzzle') {
      state.mode = 'sandbox';
      enterPuzzles(data.level || 0);
    } else {
      setModeUI();
      commit({ silent: true });
      renderPalette();
      if (!store.get('coached', false)) $('coach').hidden = false;
    }
    if (hash) toast('Loaded the laws from this link.');
    requestAnimationFrame(loop);
  }

  const hot = window.claude && window.claude.hot;
  if (hot && typeof hot.snapshot === 'function') {
    hot.snapshot(() => ({
      mode: state.mode,
      level: state.level,
      code: S.encodeRows(state.mode === 'sandbox' ? ids() : (sandboxSave ? sandboxSave.rows.map((r) => r.map((t) => t.w)) : ids())),
    }));
  }
  if (hot && typeof hot.ready === 'function') hot.ready((d) => boot(d || {}));
  else boot((hot && hot.data) || {});

  window.__sandtax = { world, state, loadLevel, enterPuzzles, enterSandbox, loadCode, commit };
})();
