// แบบทดสอบสุ่ม: ข้อถูก/ผิดจากข้อสอบจริง + ปรนัยจากคำใบ้ + ข้อคำนวณสุ่มตัวเลข
import { $, $$, esc, tex, pageData, store, stepsHtml, unitTex, checkNum, shuffle, pick, fmtNum } from './lib.js';
import * as f from './engine/formulas.js';
import { lBracket, heatExam } from './engine/problems.js';
import { flashcards } from './flashdata.js';
import * as seen from './seen.js';

const { exams } = pageData();
const app = $('#quiz-app');
const rnd = (a, b, step = 1) => Math.round((a + Math.random() * (b - a)) / step) * step;

// ---------- คลังคำถาม ----------
function tfPool() {
  return exams.flatMap((p) => p.questions.filter((q) => q.type === 'tf').map((q) => ({ kind: 'tf', topic: p.topic, q: q.q, ans: q.tf, why: q.why })));
}
function mcqPool() {
  return flashcards.filter((c) => !c.fig).map((c) => {
    const others = shuffle(flashcards.filter((x) => x.topic === c.topic && x.a !== c.a && !x.fig).map((x) => x.a)).slice(0, 3);
    return { kind: 'mcq', topic: c.topic, q: c.q, opts: shuffle([c.a, ...others]), ans: c.a };
  });
}
const CALC = [
  () => { const P = { I: rnd(80, 220, 10), Umin: rnd(20, 26), v: rnd(100, 300, 10) }; P.Umax = P.Umin + 2; const eta = pick([['SMAW', 0.75], ['GMAW', 0.9], ['GTAW', 0.8]]); const S = heatExam({ ...P, eta: eta[1] });
    return { kind: 'num', topic: 'welding', q: `เชื่อม ${eta[0]} กระแส ${P.I} A แรงดัน ${P.Umin} ถึง ${P.Umax} V ความเร็วเดิน ${P.v} mm/min หา Heat input (kJ/mm) ใช้ประสิทธิภาพตามสไลด์`, ans: S.answers.Q, unit: 'kJ/mm', steps: S.parts.all }; },
  () => { const Ir = pick([200, 250, 300, 400]), Dr = pick([35, 40, 60]), Iu = Ir + rnd(-80, 80, 10); const d = f.dutyCycle(Ir, Dr, Iu);
    return { kind: 'num', topic: 'welding', q: `เครื่องเชื่อมพิกัด ${Ir} A ที่ duty cycle ${Dr}% ถ้าใช้กระแส ${Iu} A จะได้ duty cycle กี่ %`, ans: d.value, unit: '%', steps: [d.step] }; },
  () => { const p = pick(['SMAW', 'GTAW', 'GMAW']), I = rnd(80, 350, 10); const u = f.loadVoltage(p, I);
    return { kind: 'num', topic: 'welding', q: `ตามมาตรฐาน IEC 974-1 เครื่องเชื่อม ${p} ที่กระแส ${I} A ควรมีแรงดันขณะเชื่อม U₂ เท่าใด (V)`, ans: u.value, unit: 'V', steps: [u.step] }; },
  () => { const t = pick([1, 1.2, 1.5, 2, 3]), Ac = pick(f.AC_TABLE); const c = f.clearance(Ac.Ac, t);
    return { kind: 'num', topic: 'sheet-metal', q: `แผ่น${Ac.label.split(',')[0]} หนา ${t} mm ต้องตั้ง clearance เท่าใด (mm)`, ans: c.value, unit: 'mm', steps: [c.step] }; },
  () => { const t = pick([1, 1.5, 2, 3]), len = rnd(20, 40), w = rnd(6, 12, 2), Sss = pick([250, 300, 345]); const L = f.slotPerimeter(len, w), F = f.shearForce(t, L.value, Sss);
    return { kind: 'num', topic: 'sheet-metal', q: `เจาะรูยาวปลายมน ยาว ${len} กว้าง ${w} mm บนแผ่นหนา ${t} mm ที่มี S_ss ${Sss} N/mm² ต้องใช้แรงตัดกี่ kN`, ans: F.value / 1000, unit: 'kN', steps: [L.step, F.step] }; },
  () => { const t = pick([1, 1.5, 2, 3]), R = pick([t, 1.5 * t, 2 * t, 3 * t]), A = pick([90, 90, 60, 45, 120]); const K = f.kba(R, t), BA = f.bendAllowance(A, R, t, K.value);
    return { kind: 'num', topic: 'sheet-metal', q: `พับแผ่นหนา ${t} mm รัศมีใน ${R} mm เป็นมุม ${A}° หา bend allowance (mm)`, ans: BA.value, unit: 'mm', steps: [K.step, BA.step] }; },
  () => { const t = pick([1, 1.5, 2]), a = rnd(30, 60), b = rnd(10, 25); const P = lBracket({ t, R: t, a, b, width: 100 });
    return { kind: 'num', topic: 'sheet-metal', q: `แผ่นพับตัว L หนา ${t} mm รัศมีพับใน ${t} mm ขนาดวัดผิวนอก ${a} × ${b} mm หาความยาวแผ่นก่อนพับ L_b (mm)`, ans: P.answers.Lb, unit: 'mm', steps: P.parts.lb }; },
  () => { const UTS = pick([400, 480, 520]), L = rnd(80, 200, 10), t = pick([1, 1.5, 2, 3]), W = pick([8, 10, 16, 24]), k = pick([[1.33, 'V-bending'], [0.33, 'Edge bending']]); const F = f.bendForce(k[0], UTS, L, t, W);
    return { kind: 'num', topic: 'sheet-metal', q: `${k[1]} แผ่นยาวตามแนวพับ ${L} mm หนา ${t} mm UTS ${UTS} N/mm² die open ${W} mm ต้องใช้แรงพับกี่ kN`, ans: F.value / 1000, unit: 'kN', steps: [F.step] }; },
  () => { const d = rnd(60, 160, 10), Ha = rnd(60, 160, 10); const c = f.cone(d, Ha);
    return { kind: 'num', topic: 'sheet-metal', q: `กรวยฐานกว้าง ${d} mm สูง ${Ha} mm แผ่นคลี่เป็นรูปพัดมุมกี่องศา`, ans: c.theta, unit: '°', steps: c.steps }; },
];

let S = null;
function start(topic) {
  const want = (x) => topic === 'all' || x.topic === topic;
  const calc = CALC.map((g) => g()).filter(want);
  const pool = [...shuffle(tfPool().filter(want)).slice(0, 3), ...shuffle(mcqPool().filter(want)).slice(0, 4), ...shuffle(calc).slice(0, 3)];
  S = { topic, qs: shuffle(pool).slice(0, 10), i: 0, score: 0, answered: false };
  show();
}

function show() {
  const { qs, i } = S;
  if (i >= qs.length) return finish();
  const q = qs[i];
  S.answered = false;
  let body = '';
  if (q.kind === 'tf') body = `<div class="opts"><button class="opt" data-v="1">ถูก</button><button class="opt" data-v="0">ผิด</button></div>`;
  if (q.kind === 'mcq') body = `<div class="opts">${q.opts.map((o) => `<button class="opt" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
  if (q.kind === 'num') body = `<div class="num-row"><label for="qnum">คำตอบ (${esc(q.unit)})</label><input id="qnum" type="text" inputmode="decimal" autocomplete="off"><button class="btn btn-primary" data-num>ตรวจ</button></div><p class="step-explain">ยอมให้คลาดเคลื่อน 1%</p>`;
  app.innerHTML = `<div class="quiz-card"><div class="quiz-top"><span>ข้อ ${i + 1} / ${qs.length}</span><span class="chip ${q.topic === 'welding' ? 'chip-arc' : 'chip-steel'}">${q.topic === 'welding' ? 'Welding' : 'Sheet Metal'}</span><span>คะแนน ${S.score}</span></div>
    <div class="bar"><i style="width:${(i / qs.length) * 100}%"></i></div>
    <p class="flash-q">${q.kind === 'tf' ? 'ถูกหรือผิด: ' : ''}${esc(q.q)}</p>${body}<div id="qfb" aria-live="polite"></div></div>`;
  $('#qnum')?.focus();
}

function grade(ok, extra) {
  if (S.answered) return;
  S.answered = true;
  if (ok) S.score++;
  $('#qfb').innerHTML = `<div class="answer ${ok ? '' : 'is-warn'}"><div class="lbl">${ok ? 'ถูกต้อง' : 'ยังไม่ถูก'}</div>${extra}</div><div style="margin-top:12px"><button class="btn btn-primary" data-next>${S.i + 1 < S.qs.length ? 'ข้อต่อไป' : 'ดูผลคะแนน'}</button></div>`;
  $('[data-next]').focus();
}

function finish() {
  const total = S.qs.length;
  const best = store.get().quizBest;
  if (!best || S.score / total >= best.score / best.total) store.set({ quizBest: { score: S.score, total } });
  seen.mark('T:quiz', { title: `แบบทดสอบล่าสุด ได้ ${S.score}/${total}`, href: 'quiz.html', kind: 'แบบทดสอบ' });
  const msg = S.score / total >= 0.8 ? 'เยี่ยมมาก พร้อมสอบแล้ว' : S.score / total >= 0.5 ? 'ดีแล้ว ทวนข้อที่พลาดอีกนิด' : 'ค่อย ๆ ทวนบทเรียนแล้วลองใหม่ เดี๋ยวก็ได้';
  app.innerHTML = `<div class="quiz-card score"><p class="big">${S.score}/${total}</p><p>${msg}</p><div class="hero-actions" style="justify-content:center"><button class="btn btn-primary" data-start="${S.topic}">สุ่มชุดใหม่</button><a class="btn" href="exams.html">ไปดูข้อสอบเก่า</a></div></div>`;
}

function menu() {
  app.innerHTML = `<div class="quiz-card"><p>เลือกหมวด แล้วระบบจะสุ่ม 10 ข้อ (ถูก/ผิด ปรนัย และคำนวณ) ทุกครั้งที่เริ่มใหม่ตัวเลขจะเปลี่ยน</p>
    <div class="hero-actions"><button class="btn btn-primary" data-start="all">ทั้งสองบท</button><button class="btn" data-start="sheet-metal">Sheet Metal</button><button class="btn" data-start="welding">Welding</button></div></div>`;
}

app.addEventListener('click', (e) => {
  const st = e.target.closest('[data-start]');
  if (st) return start(st.dataset.start);
  if (e.target.closest('[data-next]')) { S.i++; return show(); }
  const q = S?.qs[S.i];
  if (!q || S.answered) return;
  const o = e.target.closest('.opt');
  if (o) {
    const ok = q.kind === 'tf' ? (o.dataset.v === '1') === q.ans : o.dataset.v === q.ans;
    $$('.opt', app).forEach((b) => { b.disabled = true; const right = q.kind === 'tf' ? (b.dataset.v === '1') === q.ans : b.dataset.v === q.ans; if (right) b.classList.add('is-right'); else if (b === o) b.classList.add('is-wrong'); });
    grade(ok, q.kind === 'tf' ? `<div>ข้อนี้ <b>${q.ans ? 'ถูก' : 'ผิด'}</b></div><div class="why">${esc(q.why)}</div>` : `<div>คำตอบ: <b>${esc(q.ans)}</b></div>`);
  }
  if (e.target.closest('[data-num]')) checkNumber();
});
app.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'qnum') checkNumber(); });
function checkNumber() {
  const q = S.qs[S.i];
  const r = checkNum($('#qnum').value, q.ans);
  if (r === null) { $('#qfb').innerHTML = '<p class="feedback bad">พิมพ์เป็นตัวเลข</p>'; return; }
  grade(r, `<div>คำตอบ ${tex(unitTex(q.ans, q.unit === '°' ? '' : q.unit))}${q.unit === '°' ? '°' : ''}</div>${stepsHtml(q.steps)}`);
}
menu();
void fmtNum;
