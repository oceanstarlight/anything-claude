/* 화면 전환, 문항 진행, 결과 렌더링 */
(function () {
  var AIQ = window.AIQ;
  var $ = function (id) { return document.getElementById(id); };
  var SCREENS = ['intro', 'quiz', 'loading', 'result', 'gallery'];
  var KEYS = ['A', 'B', 'C', 'D'];
  var state = { i: 0, answers: [] };
  var lastResultHash = '';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function show(id) {
    SCREENS.forEach(function (s) { $(s).hidden = s !== id; });
    window.scrollTo(0, 0);
  }
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  function store(k, v) {
    try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; }
  }

  /* ---------- 시작 화면 ---------- */
  function buildIntro() {
    // 마스코트 무리를 손으로 붙인 스티커처럼 배치
    var picks = ['claude', 'chatgpt', 'gemini', 'grok', 'llama', 'deepseek', 'qwen'];
    var pos = [[12, 100, -8], [27, 0, 6], [38, 104, -3], [52, 4, 8], [63, 98, -6], [2, 2, 4], [75, 0, -10]];
    $('introCrowd').innerHTML = picks.map(function (id, k) {
      var p = pos[k];
      return '<div class="m" style="left:' + p[0] + '%;top:' + p[1] + 'px;--r:' + p[2] + 'deg;transform:rotate(' + p[2] + 'deg);animation-delay:' + (k * -0.45) + 's">' +
        AIQ.mascot(AIQ.typeById(id), { decorative: true }) + '</div>';
    }).join('');
  }

  /* ---------- 문항 ---------- */
  function startQuiz() {
    state = { i: 0, answers: [] };
    if (location.hash === '#quiz') renderQuiz(); else location.hash = 'quiz';
  }

  function renderQuiz() {
    show('quiz');
    var total = AIQ.QUESTIONS.length;
    var q = AIQ.QUESTIONS[state.i];
    var pct = state.i / total * 100;
    $('progressFill').style.width = 'calc(' + pct + '% - ' + (pct ? 2 : 0) + 'px)';
    $('progressWalker').style.left = pct + '%';
    $('progress').setAttribute('aria-valuenow', state.i + 1);
    $('progressNum').textContent = (state.i + 1) + '/' + total;
    $('qIndex').textContent = 'Q' + (state.i + 1);
    $('qText').textContent = q.q;
    $('backBtn').disabled = false;
    var prev = state.answers[state.i];
    $('answers').innerHTML = q.a.map(function (a, k) {
      return '<li><button type="button" class="answer' + (prev === k ? ' prev' : '') + '" data-k="' + k + '">' +
        '<span class="key">' + KEYS[k] + '</span><span>' + esc(a.t) + '</span></button></li>';
    }).join('');
    var wrap = $('qWrap');
    wrap.classList.remove('out');
    wrap.style.animation = 'none'; void wrap.offsetWidth; wrap.style.animation = '';
  }

  function pick(k) {
    if (state.busy) return;
    state.busy = true;
    state.answers[state.i] = k;
    var btn = $('answers').querySelector('[data-k="' + k + '"]');
    if (btn) btn.classList.add('picked');
    setTimeout(function () {
      $('qWrap').classList.add('out');
      setTimeout(function () {
        state.busy = false;
        if (state.i < AIQ.QUESTIONS.length - 1) { state.i++; renderQuiz(); }
        else finish();
      }, 170);
    }, 230);
  }

  function back() {
    if (state.busy) return;
    if (state.i === 0) { location.hash = ''; return; }
    state.i--;
    renderQuiz();
  }

  /* ---------- 결과 계산 ---------- */
  function finish() {
    var scores = AIQ.score(state.answers);
    var top = AIQ.rank(scores)[0].type;
    var hash = 'r=' + top.id + '&s=' + AIQ.AXES.map(function (a) { return scores[a.key]; }).join('-');
    show('loading');
    var lines = ['답변을 읽는 중…', '말투를 분석하는 중…', '파라미터 세는 중…', '닮은꼴 찾는 중…'];
    var ids = AIQ.TYPES.map(function (t) { return t.id; });
    $('loadingStack').innerHTML = ids.map(function (id) {
      return '<div class="m">' + AIQ.mascot(AIQ.typeById(id), { decorative: true }) + '</div>';
    }).join('');
    var nodes = $('loadingStack').children, n = 0;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var timer = setInterval(function () {
      for (var j = 0; j < nodes.length; j++) nodes[j].classList.toggle('on', j === n % nodes.length);
      $('loadingText').textContent = lines[Math.min(lines.length - 1, Math.floor(n / 4))];
      n++;
    }, 110);
    setTimeout(function () {
      clearInterval(timer);
      store('aiq_mine', hash);
      lastResultHash = hash;
      location.hash = hash;
    }, reduce ? 300 : 1900);
  }

  function parseHash() {
    var h = location.hash.replace(/^#/, '');
    var out = {};
    h.split('&').forEach(function (kv) {
      var p = kv.split('=');
      if (p[0]) out[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
    });
    return { raw: h, params: out };
  }

  function parseScores(s) {
    if (!s) return null;
    var parts = s.split('-').map(Number);
    if (parts.length !== AIQ.AXES.length || parts.some(function (x) { return !(x >= 0 && x <= 100); })) return null;
    var out = {};
    AIQ.AXES.forEach(function (a, k) { out[a.key] = Math.round(parts[k]); });
    return out;
  }

  /* ---------- 결과 화면 ---------- */
  function traitHTML(scores, type) {
    var src = scores || type.v;
    return AIQ.AXES.map(function (ax) {
      var v = src[ax.key];
      var right = v >= 50;
      var lo = Math.min(v, 50), hi = Math.max(v, 50);
      return '<div class="trait">' +
        '<div class="trait-labels"><span class="' + (right ? 'off' : 'on') + '">' + ax.left + (right ? '' : ' ' + (100 - v) + '%') + '</span>' +
        '<span class="' + (right ? 'on' : 'off') + '">' + (right ? v + '% ' : '') + ax.right + '</span></div>' +
        '<div class="trait-bar"><div class="trait-fill" data-l="' + lo + '" data-w="' + (hi - lo) + '" style="left:50%;width:0"></div>' +
        '<div class="trait-dot" data-x="' + v + '" style="left:50%"></div></div></div>';
    }).join('');
  }

  function matchHTML(kind, m) {
    var t = AIQ.typeById(m.id);
    return '<button type="button" class="match" data-goto="' + t.id + '">' +
      '<span class="match-art" style="background:' + t.color + '">' + AIQ.mascot(t, { decorative: true }) + '</span>' +
      '<span><span class="match-tag ' + (kind === 'good' ? 'good">찰떡궁합' : 'bad">환장의 조합') + '</span>' +
      '<span class="match-name">' + esc(t.name) + '</span>' +
      '<span class="match-why">' + esc(m.why) + '</span></span></button>';
  }

  var ICON = {
    down: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    link: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    redo: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  function renderResult(type, scores, mode) {
    var dark = AIQ.isDark(type.color);
    var el = $('result');
    el.style.setProperty('--accent', type.color);
    el.style.setProperty('--hero-ink', dark ? '#FFF8EC' : '#2B2118');
    var ranked = scores ? AIQ.rank(scores) : null;
    var label = mode === 'mine' ? '나랑 닮은 AI는' : mode === 'shared' ? '친구랑 닮은 AI는' : 'AI 유형 살펴보기';

    var html = '';
    if (mode === 'shared') {
      html += '<div class="shared-banner"><span>친구가 공유한 결과예요</span><button type="button" class="btn btn-primary" data-act="start">나도 해보기</button></div>';
    }
    if (mode === 'type') {
      html += '<div class="shared-banner"><span>16가지 유형 중 하나예요</span><button type="button" class="btn" data-act="gallery">전체 보기</button></div>';
    }
    html += '<div class="hero">' +
      (ranked ? '<span class="hero-pct">닮은 정도 ' + ranked[0].pct + '%</span>' : '') +
      (type.local ? '<span class="hero-local">로컬 실행 OK</span>' : '') +
      '<div class="hero-label">' + label + '</div>' +
      '<div class="hero-art">' + AIQ.mascot(type) + '</div>' +
      '<h2 class="hero-name">' + esc(type.name) + '</h2>' +
      '<div class="hero-maker">by ' + esc(type.maker) + '</div>' +
      '<div class="hero-nick">' + esc(type.nick) + '</div>' +
      '</div>';
    html += '<p class="quote">"' + esc(type.tagline) + '"</p>';

    html += '<div class="block"><h3>' + (mode === 'mine' ? '이런 사람이에요' : '이런 성향이에요') + '</h3>' +
      '<div class="kw">' + type.keywords.map(function (k) { return '<span class="chip">' + esc(k) + '</span>'; }).join('') + '</div>' +
      type.desc.split('\n\n').map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>';

    html += '<div class="two"><div class="mini"><span class="tag">빛나는 순간</span><p>' + esc(type.good) + '</p></div>' +
      '<div class="mini"><span class="tag">이럴 땐 조심</span><p>' + esc(type.bad) + '</p></div></div>';

    html += '<div class="block"><h3>' + (scores ? '성향 그래프' : '대표 성향') + '</h3><div class="traits">' + traitHTML(scores, type) + '</div>' +
      (scores ? '' : '<p class="trait-note">테스트를 하면 내 점수로 보여드려요</p>') + '</div>';

    html += '<div class="block"><h3>AI 궁합</h3>' + matchHTML('good', type.best) + matchHTML('bad', type.worst) + '</div>';

    if (ranked) {
      html += '<div class="block"><h3>이 AI들과도 닮았어요</h3><div class="runner">' +
        ranked.slice(1, 4).map(function (r, k) {
          return '<div class="runner-row"><span class="rk">' + (k + 2) + '</span><span class="ra">' + AIQ.mascot(r.type, { decorative: true }) + '</span>' +
            '<span class="rn">' + esc(r.type.name) + '</span><span class="rp">' + r.pct + '%</span></div>';
        }).join('') + '</div></div>';
    }

    html += '<div class="actions">';
    if (scores) {
      html += '<button type="button" class="btn" data-act="save">' + ICON.down + '이미지 저장</button>' +
        '<button type="button" class="btn" data-act="share">' + ICON.link + '결과 공유</button>';
    }
    html += '<button type="button" class="btn btn-primary btn-big" data-act="start">' + (mode === 'mine' ? ICON.redo + '다시 하기' : '나도 테스트하기') + '</button>' +
      '</div><button type="button" class="link-btn" data-act="gallery">16가지 유형 전부 보기</button>' +
      '<p class="fine">재미로 보는 성향 테스트예요. 각 AI 회사와는 관련이 없어요.</p>';

    el.innerHTML = html;
    show('result');
    el._ctx = { type: type, scores: scores };

    // 막대 그래프 애니메이션
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.querySelectorAll('.trait-fill').forEach(function (f) { f.style.left = f.dataset.l + '%'; f.style.width = f.dataset.w + '%'; });
        el.querySelectorAll('.trait-dot').forEach(function (d) { d.style.left = d.dataset.x + '%'; });
      });
    });
    if (mode === 'mine' && store('aiq_confetti') !== location.hash) {
      store('aiq_confetti', location.hash);
      confetti(type.color);
    }
  }

  function confetti(color) {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var box = document.createElement('div');
    box.className = 'confetti';
    var colors = [color, '#FFC83D', '#FF6B4A', '#5BC9A0', '#6EC1E4', '#FF9EC4', '#FFFDF8'];
    for (var i = 0; i < 46; i++) {
      var p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px');
      p.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      p.style.animationDuration = (1.8 + Math.random() * 1.6) + 's';
      p.style.animationDelay = (Math.random() * 0.4) + 's';
      if (i % 3 === 0) { p.style.width = '8px'; p.style.height = '8px'; p.style.borderRadius = '50%'; }
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 4200);
  }

  /* ---------- 공유 / 저장 ---------- */
  function shareResult() {
    var ctx = $('result')._ctx;
    var url = location.href;
    var text = '나랑 닮은 AI는 ' + ctx.type.name + '! (' + ctx.type.nick + ') 너는 어떤 AI야?';
    if (navigator.share) {
      navigator.share({ title: '나랑 닮은 AI는?', text: text, url: url }).catch(function () {});
      return;
    }
    copy(url).then(function () { toast('링크를 복사했어요'); }, function () { prompt('아래 링크를 복사하세요', url); });
  }
  function copy(s) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(s);
    return new Promise(function (ok, no) {
      var ta = document.createElement('textarea');
      ta.value = s; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? ok() : no(); } catch (e) { no(e); }
      ta.remove();
    });
  }
  function saveImage(btn) {
    var ctx = $('result')._ctx;
    btn.disabled = true;
    toast('이미지를 만드는 중…');
    AIQ.makeCard(ctx.type, ctx.scores).then(function (blob) {
      btn.disabled = false;
      var name = 'ai-닮은꼴-' + ctx.type.id + '.png';
      var file = typeof File === 'function' ? new File([blob], name, { type: 'image/png' }) : null;
      // 모바일은 공유 시트(사진에 저장)로, 데스크톱은 다운로드로
      var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
      if (coarse && file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: '나랑 닮은 AI는?' }).catch(function () {});
        return;
      }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      toast('이미지를 저장했어요');
    }).catch(function () {
      btn.disabled = false;
      toast('이미지를 만들지 못했어요. 화면을 캡처해주세요');
    });
  }

  /* ---------- 갤러리 ---------- */
  function renderGallery() {
    $('typeGrid').innerHTML = AIQ.TYPES.map(function (t) {
      return '<button type="button" class="type-card" data-goto="' + t.id + '" style="background:' + t.color + '1F">' +
        (t.local ? '<span class="tl" title="로컬 실행 가능"></span>' : '') +
        '<span class="ta">' + AIQ.mascot(t, { decorative: true }) + '</span>' +
        '<span class="tn">' + esc(t.name) + '</span><span class="tk">' + esc(t.nick) + '</span></button>';
    }).join('');
    show('gallery');
  }

  /* ---------- 라우팅 ---------- */
  function route() {
    var h = parseHash();
    var p = h.params;
    if (h.raw === 'quiz') {
      if (!state.answers.length && state.i === 0) state = { i: 0, answers: [] };
      return renderQuiz();
    }
    if (h.raw === 'types') return renderGallery();
    if (p.r && AIQ.typeById(p.r)) {
      var scores = parseScores(p.s);
      var mine = store('aiq_mine') === h.raw || lastResultHash === h.raw;
      // 점수가 있으면 점수 기준으로 유형을 다시 계산 (주소 조작 방지)
      var type = scores ? AIQ.rank(scores)[0].type : AIQ.typeById(p.r);
      return renderResult(type, scores, scores ? (mine ? 'mine' : 'shared') : 'type');
    }
    if (p.t && AIQ.typeById(p.t)) return renderResult(AIQ.typeById(p.t), null, 'type');
    show('intro');
  }

  /* ---------- 이벤트 ---------- */
  $('startBtn').addEventListener('click', startQuiz);
  $('galleryStart').addEventListener('click', startQuiz);
  $('browseBtn').addEventListener('click', function () { location.hash = 'types'; });
  $('galleryBack').addEventListener('click', function () { history.length > 1 ? history.back() : (location.hash = ''); });
  $('backBtn').addEventListener('click', back);
  $('answers').addEventListener('click', function (e) {
    var b = e.target.closest('.answer');
    if (b) pick(+b.dataset.k);
  });
  document.addEventListener('keydown', function (e) {
    if ($('quiz').hidden || e.metaKey || e.ctrlKey || e.altKey) return;
    var k = '1234'.indexOf(e.key);
    if (k < 0) k = 'abcd'.indexOf(e.key.toLowerCase());
    if (k >= 0 && k < AIQ.QUESTIONS[state.i].a.length) pick(k);
    if (e.key === 'Backspace') back();
  });
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-goto]');
    if (g) { location.hash = 't=' + g.dataset.goto; return; }
    var a = e.target.closest('[data-act]');
    if (!a) return;
    var act = a.dataset.act;
    if (act === 'start') startQuiz();
    else if (act === 'gallery') location.hash = 'types';
    else if (act === 'share') shareResult();
    else if (act === 'save') saveImage(a);
  });
  window.addEventListener('hashchange', route);

  buildIntro();
  $('progressWalker').innerHTML = AIQ.mascot(AIQ.typeById('llama'), { decorative: true });
  route();
})();
