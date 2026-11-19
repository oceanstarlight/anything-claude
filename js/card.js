/* 결과 공유용 이미지(1080x1920, 인스타 스토리 비율) 생성 */
(function (root) {
  var AIQ = root.AIQ || (root.AIQ = {});
  var W = 1080, H = 1920;
  var INK = '#2B2118', PAPER = '#FFF8EC', CARD = '#FFFDF8';
  var DISPLAY = "'Jua', 'Pretendard Variable', sans-serif";
  var BODY = "'Pretendard Variable', Pretendard, 'Apple SD Gothic Neo', sans-serif";

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  // 테두리 + 오프셋 그림자가 있는 박스
  function box(ctx, x, y, w, h, r, fill, shadow) {
    if (shadow) { rr(ctx, x + shadow, y + shadow, w, h, r); ctx.fillStyle = INK; ctx.fill(); }
    rr(ctx, x, y, w, h, r);
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  }
  function wrap(ctx, text, maxW) {
    var words = text.split(' '), lines = [], line = '';
    words.forEach(function (w) {
      var test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    });
    if (line) lines.push(line);
    return lines;
  }
  function svgImage(svg) {
    return new Promise(function (ok, no) {
      var img = new Image();
      img.onload = function () { ok(img); };
      img.onerror = no;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  AIQ.makeCard = function (type, scores) {
    var fonts = document.fonts && document.fonts.load
      ? Promise.all([document.fonts.load('80px Jua', '닮은AI'), document.fonts.load('700 40px "Pretendard Variable"', '가A')]).catch(function () {})
      : Promise.resolve();
    var ranked = AIQ.rank(scores);
    var art = AIQ.mascot(type).replace('<svg ', '<svg width="640" height="697" ');

    return Promise.all([fonts, svgImage(art)]).then(function (res) {
      var img = res[1];
      var c = document.createElement('canvas');
      c.width = W; c.height = H;
      var ctx = c.getContext('2d');
      var dark = AIQ.isDark(type.color);

      // 배경: 유형 색 + 점 패턴
      ctx.fillStyle = type.color; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = dark ? 'rgba(255,248,236,.08)' : 'rgba(43,33,24,.07)';
      for (var y = 20; y < H; y += 44) for (var x = (y / 44 % 2) * 22 + 10; x < W; x += 44) { ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill(); }

      // 상단 라벨
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.save(); ctx.translate(W / 2, 130); ctx.rotate(-0.03);
      ctx.font = '52px ' + DISPLAY;
      var lw = ctx.measureText('나랑 닮은 AI는').width + 80;
      box(ctx, -lw / 2, -50, lw, 100, 50, CARD, 8);
      ctx.fillStyle = INK; ctx.fillText('나랑 닮은 AI는', 0, 4);
      ctx.restore();

      // 본문 카드
      var cx = 70, cy = 230, cw = W - 140, ch = 1560;
      box(ctx, cx, cy, cw, ch, 56, CARD, 16);

      // 마스코트 원형 배경
      ctx.beginPath(); ctx.arc(W / 2, 560, 270, 0, 7);
      ctx.fillStyle = '#FFF1D9'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      ctx.drawImage(img, W / 2 - 300, 560 - 340, 600, 654);

      // 닮은 정도 / 로컬 스티커
      ctx.save(); ctx.translate(200, 330); ctx.rotate(-0.12);
      box(ctx, -95, -42, 190, 84, 42, '#FFC83D', 6);
      ctx.fillStyle = INK; ctx.font = '700 34px ' + BODY; ctx.fillText(ranked[0].pct + '% 일치', 0, 2);
      ctx.restore();
      if (type.local) {
        ctx.save(); ctx.translate(870, 340); ctx.rotate(0.1);
        box(ctx, -110, -40, 220, 80, 20, '#CFF3B5', 6);
        ctx.fillStyle = INK; ctx.font = '700 30px ' + BODY; ctx.fillText('로컬 실행 OK', 0, 2);
        ctx.restore();
      }

      // 이름
      ctx.fillStyle = INK;
      ctx.font = '150px ' + DISPLAY;
      var nameSize = 150;
      while (ctx.measureText(type.name).width > cw - 120 && nameSize > 80) { nameSize -= 6; ctx.font = nameSize + 'px ' + DISPLAY; }
      ctx.fillText(type.name, W / 2, 930);
      ctx.font = '600 34px ' + BODY; ctx.fillStyle = '#6B5D50';
      ctx.fillText('by ' + type.maker, W / 2, 1020);

      // 별명 스티커
      ctx.font = '56px ' + DISPLAY;
      var nw = ctx.measureText(type.nick).width + 70;
      ctx.save(); ctx.translate(W / 2, 1112); ctx.rotate(-0.025);
      box(ctx, -nw / 2, -50, nw, 100, 24, type.color, 0);
      ctx.fillStyle = dark ? PAPER : INK; ctx.fillText(type.nick, 0, 4);
      ctx.restore();

      // 한 줄 대사
      ctx.font = '40px ' + DISPLAY; ctx.fillStyle = INK;
      wrap(ctx, '"' + type.tagline + '"', cw - 160).slice(0, 2).forEach(function (l, i) { ctx.fillText(l, W / 2, 1222 + i * 54); });

      // 성향 막대
      var bx = 290, bw = W - 580, by0 = 1330;
      AIQ.AXES.forEach(function (ax, i) {
        var v = scores[ax.key], y = by0 + i * 78;
        ctx.font = '700 28px ' + BODY;
        ctx.textAlign = 'left'; ctx.fillStyle = v < 50 ? INK : '#9A8C7E'; ctx.fillText(ax.left, 130, y);
        ctx.textAlign = 'right'; ctx.fillStyle = v >= 50 ? INK : '#9A8C7E'; ctx.fillText(ax.right, W - 130, y);
        var x0 = bx, w0 = bw;
        rr(ctx, x0, y - 13, w0, 26, 13); ctx.fillStyle = PAPER; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
        var lo = Math.min(v, 50), hi = Math.max(v, 50);
        if (hi - lo > 1) { rr(ctx, x0 + w0 * lo / 100, y - 9, w0 * (hi - lo) / 100, 18, 9); ctx.fillStyle = type.color; ctx.fill(); }
        ctx.beginPath(); ctx.arc(x0 + w0 * v / 100, y, 17, 0, 7); ctx.fillStyle = CARD; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      });

      // 키워드 칩
      ctx.font = '700 32px ' + BODY;
      var chips = type.keywords.map(function (k) { return '#' + k; });
      var widths = chips.map(function (k) { return ctx.measureText(k).width + 56; });
      var total = widths.reduce(function (a, b) { return a + b; }, 0) + (chips.length - 1) * 20;
      var kx = W / 2 - total / 2;
      chips.forEach(function (k, i) {
        box(ctx, kx, 1690, widths[i], 64, 32, '#FFF1D9', 0);
        ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText(k, kx + widths[i] / 2, 1724);
        kx += widths[i] + 20;
      });

      // 하단
      ctx.textAlign = 'center';
      ctx.font = '700 32px ' + BODY; ctx.fillStyle = dark ? PAPER : INK;
      ctx.fillText('AI 닮은꼴 테스트' + (location.host ? '  ·  ' + location.host : ''), W / 2, H - 70);

      return new Promise(function (ok, no) { c.toBlob(function (b) { b ? ok(b) : no(new Error('toBlob')); }, 'image/png'); });
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
