// 점수 분포 검증: 무작위 응답 + 성향 편향 응답으로 16개 유형이 모두 나오는지 확인
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = { globalThis: {} }; ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8'), ctx);
const AIQ = ctx.AIQ, Q = AIQ.QUESTIONS, N = +process.argv[2] || 50000;
const mul = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const rnd = mul(+process.argv[3] || 2026);
const counts = {}; AIQ.TYPES.forEach(t => counts[t.id] = 0);
for (let i = 0; i < N; i++) {
  // 사람마다 축별 선호(-1~1)를 정하고 그에 맞는 보기를 확률적으로 고른다
  // 응답 일관성(온도)도 사람마다 다르게
  const pref = {}, temp = 0.5 + rnd() * 2.5; AIQ.AXES.forEach(a => pref[a.key] = rnd() * 2 - 1);
  const ans = Q.map(q => {
    const w = q.a.map(o => Math.exp(temp * AIQ.AXES.reduce((s, a) => s + (o.d[a.key] || 0) * pref[a.key], 0)));
    let r = rnd() * w.reduce((a, b) => a + b), k = 0;
    while ((r -= w[k]) > 0) k++;
    return k;
  });
  counts[AIQ.rank(AIQ.score(ans))[0].type.id]++;
}
const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
rows.forEach(([id, c]) => console.log(id.padEnd(9), (c / N * 100).toFixed(1).padStart(5) + '%', '#'.repeat(Math.round(c / N * 200))));
const missing = rows.filter(r => r[1] === 0).map(r => r[0]);
if (missing.length) { console.error('도달 불가 유형:', missing.join(', ')); process.exit(1); }
