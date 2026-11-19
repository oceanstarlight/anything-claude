/* 손그림 느낌 마스코트 SVG 생성기 (각 회사 로고와 무관한 자체 캐릭터) */
(function (root) {
  var AIQ = root.AIQ || (root.AIQ = {});
  var INK = '#2B2118', PAPER = '#FFF8EC';

  // 몸통 모양 (viewBox 0 0 200 200 기준). top = 머리 꼭대기 y, face = 얼굴 y 보정
  var SHAPES = {
    blob: { top: 22, face: 0, d: 'M100 22 C150 18 183 58 178 104 C174 152 140 181 97 178 C52 176 19 146 23 99 C26 55 54 25 100 22Z' },
    egg: { top: 20, face: 4, d: 'M101 20 C146 22 173 80 170 123 C167 161 137 182 99 181 C61 180 31 159 30 121 C29 79 56 18 101 20Z' },
    drop: { top: 16, face: 10, d: 'M100 16 C118 48 171 82 170 125 C169 161 139 183 99 182 C60 181 30 159 31 124 C32 84 82 47 100 16Z' },
    square: { top: 32, face: 2, d: 'M50 34 C82 28 124 30 155 35 C170 38 173 52 172 71 C174 104 175 137 168 160 C164 173 149 175 131 175 C103 177 75 177 52 172 C36 169 29 160 30 141 C28 109 27 79 32 54 C34 42 39 36 50 34Z' },
    triangle: { top: 26, face: 26, d: 'M100 26 C114 25 181 143 177 162 C172 179 32 181 24 165 C17 149 85 27 100 26Z' },
    cloud: { top: 38, face: 6, d: 'M62 70 C62 42 98 30 117 52 C135 34 170 46 166 80 C190 90 189 133 164 141 C163 171 129 182 107 166 C87 184 50 177 48 151 C20 146 14 104 40 94 C34 82 44 69 62 70Z' },
    bean: { top: 22, face: 2, d: 'M72 28 C112 14 171 40 172 97 C173 150 139 182 96 178 C58 175 50 145 37 122 C21 93 34 42 72 28Z' }
  };

  function eyes(kind, c, y) {
    var L = 78, R = 122;
    switch (kind) {
      case 'happy':
        return '<path d="M' + (L - 10) + ' ' + (y + 3) + ' Q' + L + ' ' + (y - 9) + ' ' + (L + 10) + ' ' + (y + 3) + '" fill="none" stroke="' + c + '" stroke-width="6" stroke-linecap="round"/>' +
          '<path d="M' + (R - 10) + ' ' + (y + 3) + ' Q' + R + ' ' + (y - 9) + ' ' + (R + 10) + ' ' + (y + 3) + '" fill="none" stroke="' + c + '" stroke-width="6" stroke-linecap="round"/>';
      case 'wide':
        return '<circle cx="' + L + '" cy="' + y + '" r="13" fill="#fff" stroke="' + INK + '" stroke-width="4"/><circle cx="' + (L + 3) + '" cy="' + (y + 2) + '" r="6" fill="' + INK + '"/>' +
          '<circle cx="' + R + '" cy="' + y + '" r="13" fill="#fff" stroke="' + INK + '" stroke-width="4"/><circle cx="' + (R + 3) + '" cy="' + (y + 2) + '" r="6" fill="' + INK + '"/>';
      case 'sleepy':
        return '<path d="M' + (L - 11) + ' ' + y + ' Q' + L + ' ' + (y + 8) + ' ' + (L + 11) + ' ' + y + '" fill="none" stroke="' + c + '" stroke-width="6" stroke-linecap="round"/>' +
          '<path d="M' + (R - 11) + ' ' + y + ' Q' + R + ' ' + (y + 8) + ' ' + (R + 11) + ' ' + y + '" fill="none" stroke="' + c + '" stroke-width="6" stroke-linecap="round"/>';
      case 'glasses':
        return '<circle cx="' + L + '" cy="' + y + '" r="16" fill="#fff" fill-opacity=".55" stroke="' + INK + '" stroke-width="5"/>' +
          '<circle cx="' + R + '" cy="' + y + '" r="16" fill="#fff" fill-opacity=".55" stroke="' + INK + '" stroke-width="5"/>' +
          '<path d="M' + (L + 16) + ' ' + y + ' Q100 ' + (y - 6) + ' ' + (R - 16) + ' ' + y + '" fill="none" stroke="' + INK + '" stroke-width="5"/>' +
          '<circle cx="' + L + '" cy="' + (y + 1) + '" r="5" fill="' + INK + '"/><circle cx="' + R + '" cy="' + (y + 1) + '" r="5" fill="' + INK + '"/>';
      case 'shades':
        return '<path d="M56 ' + (y - 10) + ' L144 ' + (y - 12) + ' L141 ' + (y + 4) + ' C138 ' + (y + 16) + ' 112 ' + (y + 16) + ' 108 ' + (y + 4) + ' L92 ' + (y + 3) + ' C88 ' + (y + 16) + ' 62 ' + (y + 17) + ' 58 ' + (y + 4) + 'Z" fill="' + INK + '" stroke="' + PAPER + '" stroke-width="3" stroke-linejoin="round"/>' +
          '<path d="M66 ' + (y - 4) + ' L78 ' + (y - 5) + '" stroke="' + PAPER + '" stroke-width="3" stroke-linecap="round"/>';
      default: // dots
        return '<ellipse cx="' + L + '" cy="' + y + '" rx="7" ry="9" fill="' + c + '"/><ellipse cx="' + R + '" cy="' + y + '" rx="7" ry="9" fill="' + c + '"/>' +
          '<circle cx="' + (L + 2) + '" cy="' + (y - 3) + '" r="2.4" fill="#fff"/><circle cx="' + (R + 2) + '" cy="' + (y - 3) + '" r="2.4" fill="#fff"/>';
    }
  }

  function mouth(kind, c, y) {
    var s = ' fill="none" stroke="' + c + '" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"';
    switch (kind) {
      case 'open': return '<path d="M86 ' + (y - 3) + ' Q100 ' + (y - 5) + ' 114 ' + (y - 3) + ' Q112 ' + (y + 15) + ' 100 ' + (y + 15) + ' Q88 ' + (y + 15) + ' 86 ' + (y - 3) + 'Z" fill="' + c + '"/>' +
        '<path d="M93 ' + (y + 9) + ' Q100 ' + (y + 5) + ' 107 ' + (y + 9) + '" fill="none" stroke="#FF8A8A" stroke-width="4" stroke-linecap="round"/>';
      case 'o': return '<ellipse cx="100" cy="' + (y + 3) + '" rx="7" ry="8"' + s + '/>';
      case 'flat': return '<path d="M89 ' + (y + 2) + ' Q100 ' + (y + 5) + ' 111 ' + (y + 1) + '"' + s + '/>';
      case 'cat': return '<path d="M84 ' + y + ' Q92 ' + (y + 10) + ' 100 ' + y + ' Q108 ' + (y + 10) + ' 116 ' + y + '"' + s + '/>';
      case 'grin': return '<path d="M80 ' + (y - 4) + ' Q100 ' + (y + 22) + ' 122 ' + (y - 6) + '"' + s + '/><path d="M104 ' + (y + 5) + ' L106 ' + (y + 12) + ' L112 ' + (y + 2) + '" fill="#fff" stroke="' + c + '" stroke-width="3" stroke-linejoin="round"/>';
      default: return '<path d="M84 ' + (y - 2) + ' Q100 ' + (y + 14) + ' 116 ' + (y - 2) + '"' + s + '/>';
    }
  }

  // 머리 위·옆 소품. t = 머리 꼭대기 y
  function accessory(kind, t, color) {
    var st = ' stroke="' + INK + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"';
    switch (kind) {
      case 'leaf':
        return '<path d="M100 ' + (t + 2) + ' Q98 ' + (t - 12) + ' 102 ' + (t - 22) + '" fill="none"' + st + '/>' +
          '<path d="M102 ' + (t - 20) + ' C112 ' + (t - 40) + ' 136 ' + (t - 36) + ' 138 ' + (t - 30) + ' C128 ' + (t - 14) + ' 110 ' + (t - 14) + ' 102 ' + (t - 20) + 'Z" fill="#7CCB6B"' + st + '/>' +
          '<path d="M100 ' + (t - 14) + ' C90 ' + (t - 30) + ' 70 ' + (t - 28) + ' 68 ' + (t - 22) + ' C76 ' + (t - 10) + ' 92 ' + (t - 8) + ' 100 ' + (t - 14) + 'Z" fill="#9BDB86"' + st + '/>';
      case 'headphones':
        return '<path d="M38 112 C30 40 170 40 162 112" fill="none" stroke="' + INK + '" stroke-width="9" stroke-linecap="round"/>' +
          '<rect x="22" y="96" width="26" height="40" rx="12" fill="#FF6B4A"' + st + '/><rect x="152" y="96" width="26" height="40" rx="12" fill="#FF6B4A"' + st + '/>';
      case 'antenna':
        return '<path d="M100 ' + (t + 2) + ' Q106 ' + (t - 14) + ' 96 ' + (t - 28) + '" fill="none"' + st + '/><circle cx="95" cy="' + (t - 34) + '" r="10" fill="#FFC83D"' + st + '/>';
      case 'bolt':
        return '<path d="M150 ' + (t + 8) + ' L168 ' + (t - 24) + ' L158 ' + (t - 22) + ' L172 ' + (t - 48) + ' L144 ' + (t - 14) + ' L155 ' + (t - 16) + 'Z" fill="#FFC83D"' + st + '/>';
      case 'bubble':
        return '<circle cx="146" cy="' + (t + 4) + '" r="7" fill="#fff"' + st + '/><circle cx="160" cy="' + (t - 16) + '" r="10" fill="#fff"' + st + '/><circle cx="178" cy="' + (t - 42) + '" r="15" fill="#fff"' + st + '/>';
      case 'bun':
        return '<circle cx="100" cy="' + (t - 12) + '" r="19" fill="' + color + '"' + st + '/><path d="M88 ' + (t - 18) + ' Q100 ' + (t - 4) + ' 112 ' + (t - 18) + '" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>';
      case 'beret':
        return '<path d="M52 ' + (t + 14) + ' C50 ' + (t - 14) + ' 150 ' + (t - 26) + ' 156 ' + (t + 6) + ' C130 ' + (t + 14) + ' 80 ' + (t + 20) + ' 52 ' + (t + 14) + 'Z" fill="#E0475B"' + st + '/><path d="M106 ' + (t - 14) + ' L110 ' + (t - 26) + '"' + st + '/>';
      case 'ears':
        return '<path d="M62 ' + (t + 22) + ' C48 ' + (t - 10) + ' 54 ' + (t - 38) + ' 64 ' + (t - 40) + ' C76 ' + (t - 36) + ' 80 ' + (t - 6) + ' 80 ' + (t + 12) + 'Z" fill="' + color + '"' + st + '/>' +
          '<path d="M138 ' + (t + 22) + ' C152 ' + (t - 10) + ' 146 ' + (t - 38) + ' 136 ' + (t - 40) + ' C124 ' + (t - 36) + ' 120 ' + (t - 6) + ' 120 ' + (t + 12) + 'Z" fill="' + color + '"' + st + '/>' +
          '<path d="M66 ' + (t + 4) + ' C62 ' + (t - 12) + ' 64 ' + (t - 26) + ' 66 ' + (t - 28) + '" fill="none" stroke="#FF9EC4" stroke-width="6" stroke-linecap="round"/>' +
          '<path d="M134 ' + (t + 4) + ' C138 ' + (t - 12) + ' 136 ' + (t - 26) + ' 134 ' + (t - 28) + '" fill="none" stroke="#FF9EC4" stroke-width="6" stroke-linecap="round"/>';
      case 'bow':
        return '<path d="M100 ' + (t + 6) + ' C84 ' + (t - 20) + ' 60 ' + (t - 8) + ' 66 ' + (t + 12) + ' C72 ' + (t + 26) + ' 90 ' + (t + 16) + ' 100 ' + (t + 6) + 'Z" fill="#FF6B4A"' + st + '/>' +
          '<path d="M100 ' + (t + 6) + ' C116 ' + (t - 20) + ' 140 ' + (t - 8) + ' 134 ' + (t + 12) + ' C128 ' + (t + 26) + ' 110 ' + (t + 16) + ' 100 ' + (t + 6) + 'Z" fill="#FF6B4A"' + st + '/>' +
          '<circle cx="100" cy="' + (t + 6) + '" r="8" fill="#FFC83D"' + st + '/>';
      case 'gradcap':
        return '<path d="M100 ' + (t - 30) + ' L162 ' + (t - 10) + ' L100 ' + (t + 10) + ' L38 ' + (t - 10) + 'Z" fill="' + INK + '"' + st + '/>' +
          '<path d="M70 ' + (t) + ' L70 ' + (t + 14) + ' Q100 ' + (t + 26) + ' 130 ' + (t + 14) + ' L130 ' + t + '" fill="' + INK + '"' + st + '/>' +
          '<path d="M156 ' + (t - 10) + ' L158 ' + (t + 22) + '" stroke="#FFC83D" stroke-width="5" stroke-linecap="round"/><circle cx="158" cy="' + (t + 26) + '" r="6" fill="#FFC83D"' + st + '/>';
      case 'book':
        return '<g transform="rotate(-8 150 160)"><path d="M118 146 Q140 138 152 148 Q164 138 186 146 L186 182 Q164 174 152 184 Q140 174 118 182Z" fill="#fff"' + st + '/>' +
          '<path d="M152 148 L152 184" stroke="' + INK + '" stroke-width="4"/><path d="M126 156 L144 153 M126 164 L144 161 M160 153 L178 156 M160 161 L178 164" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/></g>';
      case 'hardhat':
        return '<path d="M56 ' + (t + 14) + ' C56 ' + (t - 30) + ' 144 ' + (t - 30) + ' 144 ' + (t + 14) + 'Z" fill="#FFC83D"' + st + '/>' +
          '<path d="M42 ' + (t + 14) + ' L158 ' + (t + 14) + '" stroke="' + INK + '" stroke-width="9" stroke-linecap="round"/><path d="M100 ' + (t - 18) + ' L100 ' + (t + 8) + '" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/>';
      case 'flower':
        var cx = 62, cy = t + 14, p = '';
        for (var i = 0; i < 5; i++) {
          var a = i * 72 * Math.PI / 180;
          p += '<circle cx="' + (cx + Math.cos(a) * 12).toFixed(1) + '" cy="' + (cy + Math.sin(a) * 12).toFixed(1) + '" r="9" fill="#FFF3A8" stroke="' + INK + '" stroke-width="4"/>';
        }
        return p + '<circle cx="' + cx + '" cy="' + cy + '" r="7" fill="#FF9A3C" stroke="' + INK + '" stroke-width="4"/>';
      case 'tie':
        return '<path d="M92 160 L108 160 L104 168 L112 196 L100 206 L88 196 L96 168Z" fill="#FFC83D"' + st + '/>';
      case 'magnifier':
        return '<path d="M168 178 L188 200" stroke="' + INK + '" stroke-width="10" stroke-linecap="round"/><circle cx="156" cy="164" r="20" fill="#DFF3FB" fill-opacity=".9"' + st + '/>' +
          '<path d="M146 156 Q150 150 158 150" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>';
      case 'wings':
        return '<path d="M30 100 C4 88 -6 116 8 124 C-2 138 14 152 30 140Z" fill="#fff"' + st + '/>' +
          '<path d="M170 100 C196 88 206 116 192 124 C202 138 186 152 170 140Z" fill="#fff"' + st + '/>';
      default: return '';
    }
  }

  function isDark(hex) {
    var n = parseInt(hex.slice(1), 16);
    var r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) < 110;
  }
  AIQ.isDark = isDark;

  // 뒤에 깔리는 소품(헤드폰 밴드 등)과 앞에 오는 소품 구분
  var BEHIND = { headphones: false, ears: true, wings: true };

  AIQ.mascot = function (type, opts) {
    opts = opts || {};
    var sh = SHAPES[type.shape] || SHAPES.blob;
    var fc = isDark(type.color) ? PAPER : INK;
    var ey = 100 + sh.face, my = 128 + sh.face;
    var acc = accessory(type.acc, sh.top, type.color);
    var cheeks = '<ellipse cx="62" cy="' + (my - 6) + '" rx="10" ry="6" fill="#FF7A8A" opacity=".45"/>' +
      '<ellipse cx="138" cy="' + (my - 6) + '" rx="10" ry="6" fill="#FF7A8A" opacity=".45"/>';
    var body = '<path d="' + sh.d + '" fill="' + type.color + '" stroke="' + INK + '" stroke-width="5.5" stroke-linejoin="round"/>';
    var shadow = '<ellipse cx="100" cy="196" rx="58" ry="8" fill="' + INK + '" opacity=".12"/>';
    var inner = shadow + (BEHIND[type.acc] ? acc : '') + body + cheeks + eyes(type.eyes, fc, ey) + mouth(type.mouth, fc, my) + (BEHIND[type.acc] ? '' : acc);
    var size = opts.size ? ' width="' + opts.size + '" height="' + opts.size + '"' : '';
    var label = opts.decorative ? ' aria-hidden="true"' : ' role="img" aria-label="' + type.name + ' 캐릭터"';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -36 224 244"' + size + label + '>' + inner + '</svg>';
  };
})(typeof window !== 'undefined' ? window : globalThis);
