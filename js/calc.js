// เครื่องคำนวณ: ใช้ engine เดียวกับที่ผ่านการทดสอบ
import { $, $$, esc, tex, stepsHtml, unitTex, fmtNum } from './lib.js';
import * as f from './engine/formulas.js';
import { hat, uChannel, lBracket } from './engine/problems.js';

const app = $('#calc-app');
const TABS = [
  ['bend', 'ความยาวแผ่นก่อนพับ + แรงพับ'],
  ['cut', 'Clearance + แรงตัด'],
  ['cone', 'แผ่นคลี่กรวย'],
  ['heat', 'Heat input'],
  ['duty', 'Duty cycle'],
  ['u2', 'แรงดันขณะเชื่อม U₂'],
  ['rivet', 'หมุดย้ำ'],
];
let tab = TABS.some(([k]) => k === location.hash.slice(1)) ? location.hash.slice(1) : 'bend';

const num = (id, label, val, step = 'any', hint = '') => `<div class="field"><label for="${id}">${label}</label><input id="${id}" type="number" inputmode="decimal" step="${step}" value="${val}">${hint ? `<small>${hint}</small>` : ''}</div>`;
const sel = (id, label, opts, val) => `<div class="field"><label for="${id}">${label}</label><select id="${id}">${opts.map(([v, l]) => `<option value="${v}" ${String(v) === String(val) ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`;
const v = (id) => parseFloat($(`#${id}`, app)?.value);
const s = (id) => $(`#${id}`, app)?.value;
const kN = (N) => `${tex(unitTex(N, 'N'))} = ${tex(unitTex(N / 1000, 'kN'))}`;

// ---------- รูปหน้าตัดชิ้นงาน ----------
function profileSvg(shape, P) {
  const W = 360, H = 170, pad = 28;
  let pts = [], dims = [];
  if (shape === 'L') { pts = [[0, 0], [0, P.a], [P.b, P.a]]; }
  if (shape === 'U') { pts = [[0, 0], [0, P.leg], [P.span + P.t, P.leg], [P.span + P.t, 0]]; }
  if (shape === 'hat') { const fl = (P.totalW - P.crown) / 2; pts = [[0, 0], [fl, 0], [fl, P.H], [fl + P.crown, P.H], [fl + P.crown, 0], [P.totalW, 0]]; }
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const sx = (W - 2 * pad) / Math.max(1, Math.max(...xs) - Math.min(...xs)), sy = (H - 2 * pad) / Math.max(1, Math.max(...ys) - Math.min(...ys));
  const k = Math.min(sx, sy);
  const ox = (W - (Math.max(...xs) - Math.min(...xs)) * k) / 2, oy = H - (H - (Math.max(...ys) - Math.min(...ys)) * k) / 2;
  const X = (x) => ox + (x - Math.min(...xs)) * k, Y = (y) => oy - (y - Math.min(...ys)) * k;
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ');
  if (shape === 'L') dims = [[X(0) - 14, (Y(0) + Y(P.a)) / 2, P.a, -90], [(X(0) + X(P.b)) / 2, Y(P.a) - 10, P.b, 0]];
  if (shape === 'U') dims = [[(X(0) + X(P.span + P.t)) / 2, Y(P.leg) - 10, P.span, 0], [X(0) - 14, (Y(0) + Y(P.leg)) / 2, P.leg, -90]];
  if (shape === 'hat') { const fl = (P.totalW - P.crown) / 2; dims = [[(X(fl) + X(fl + P.crown)) / 2, Y(P.H) - 10, P.crown, 0], [X(fl) - 14, (Y(0) + Y(P.H)) / 2, P.H, -90], [(X(0) + X(P.totalW)) / 2, Y(0) + 20, `${P.totalW} (รวม)`, 0]]; }
  return `<svg class="diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="ภาพหน้าตัดชิ้นงาน"><path class="part" d="${d}"/>${dims.map(([x, y, t, r]) => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" transform="rotate(${r} ${x.toFixed(1)} ${y.toFixed(1)})">${t}</text>`).join('')}</svg>`;
}

// ---------- แท็บ ----------
const VIEWS = {
  bend: {
    form: () => `${sel('shape', 'รูปแบบชิ้นงาน', [['hat', 'หมวก 4 มุม (ข้อสอบ 2/2563)'], ['U', 'ตัว U คว่ำ 2 มุม (ข้อสอบ 2/2562)'], ['L', 'ตัว L 1 มุม (สไลด์ 23)']], 'hat')}
      <div id="shape-fields" class="fields" style="margin-top:12px"></div>
      <h3>แรงพับ</h3><div class="fields">${num('UTS', 'UTS (N/mm²)', 480)}${num('W', 'Die open W (mm)', 10)}${sel('kbf', 'ชนิดการพับ', [[1.33, 'V-bending (1.33)'], [0.33, 'Edge bending (0.33)']], 1.33)}</div>`,
    shapeFields: {
      hat: () => `${num('t', 'ความหนา t', 1.5)}${num('R', 'รัศมีพับใน R', 1.5)}${num('totalW', 'กว้างรวม (ปลายปีกถึงปลายปีก)', 120)}${num('H', 'สูงรวม (ใต้ปีกถึงบนหลังคา)', 20)}${num('crown', 'ผิวนอกผนังถึงผิวนอกผนัง', 57)}${num('width', 'ความกว้างตามแนวพับ', 125)}`,
      U: () => `${num('t', 'ความหนา t', 3)}${num('R', 'รัศมีพับใน R', 3)}${num('span', 'หลังคา (ผิวนอกซ้ายถึงผิวในขวา)', 150)}${num('leg', 'ความสูงขา (วัดผิวนอก)', 25)}${num('width', 'ความกว้างตามแนวพับ', 100)}`,
      L: () => `${num('t', 'ความหนา t', 1.5)}${num('R', 'รัศมีพับใน R', 1.5)}${num('a', 'ขายาว (วัดผิวนอก)', 35)}${num('b', 'ขาสั้น (วัดผิวนอก)', 8)}${num('width', 'ความกว้างตามแนวพับ', 150)}`,
    },
    calc() {
      const shape = s('shape');
      const base = { t: v('t'), R: v('R'), width: v('width'), UTS: v('UTS'), W: v('W') };
      let P;
      if (shape === 'hat') P = hat({ ...base, totalW: v('totalW'), H: v('H'), crown: v('crown') });
      if (shape === 'U') P = uChannel({ ...base, span: v('span'), leg: v('leg') });
      if (shape === 'L') P = lBracket({ ...base, a: v('a'), b: v('b') });
      const Fb = f.bendForce(+s('kbf'), base.UTS, base.width, base.t, base.W);
      const lbSteps = P.parts.lb;
      const segs = lbSteps.filter((x) => x.id === 'flat');
      const warn = segs.some((x) => x.value <= 0) ? '<div class="box box-warn"><div class="box-title">ตรวจขนาด</div>มีช่วงตรงยาวไม่เกิน 0 แปลว่าขนาดสั้นกว่ารัศมีพับ ลองเพิ่มขนาดหรือลดรัศมี</div>' : '';
      return `${profileSvg(shape, P.params)}
        <div class="result-row"><div class="stat"><b>${fmtNum(P.answers.Lb, 2)}</b>mm ความยาวแผ่น</div><div class="stat"><b>${fmtNum(Fb.value / 1000, 2)}</b>kN แรงพับต่อแนว</div></div>
        <div class="final" style="margin-top:10px">${tex(P.summary || '')}</div>${warn}
        <h3>ความยาวแผ่นก่อนพับ</h3>${stepsHtml(lbSteps)}
        <h3>แรงพับ</h3>${stepsHtml([Fb.step])}<p class="step-explain">ผลลัพธ์ ${kN(Fb.value)}</p>`;
    },
  },
  cut: {
    form: () => `<div class="fields">${num('t', 'ความหนา t (mm)', 1.5)}${sel('ac', 'กลุ่มวัสดุ (A_c)', f.AC_TABLE.map((a) => [a.Ac, `${a.Ac} · ${a.label}`]), 0.06)}</div>
      <h3>รูปรอยตัด</h3><div class="fields">${sel('hole', 'รูปร่าง', [['slot', 'รูยาวปลายมน'], ['round', 'รูกลม'], ['rect', 'สี่เหลี่ยม'], ['line', 'ตัดตรง (Shearing)']], 'slot')}</div>
      <div id="hole-fields" class="fields" style="margin-top:12px"></div>
      <h3>ความต้านแรงเฉือน</h3><div class="fields">${sel('sssmode', 'ที่มาของ S_ss', [['given', 'โจทย์ให้มา'], ['uts', 'ประมาณจาก 0.7 × UTS']], 'given')}${num('Sss', 'S_ss หรือ UTS (N/mm²)', 300)}</div>`,
    holeFields: {
      slot: () => `${num('len', 'ความยาวทั้งหมด ℓ', 25)}${num('wid', 'ความกว้าง w', 12)}`,
      round: () => `${num('d', 'เส้นผ่านศูนย์กลาง d', 6)}${num('n', 'จำนวนรู', 1, 1)}`,
      rect: () => `${num('a', 'ด้าน a', 20)}${num('b2', 'ด้าน b', 10)}`,
      line: () => `${num('Lc', 'ความยาวแนวตัด', 191.54)}`,
    },
    calc() {
      const t = v('t'), Ac = +s('ac');
      const c = f.clearance(Ac, t);
      let per, steps = [c.step];
      const hole = s('hole');
      if (hole === 'slot') per = f.slotPerimeter(v('len'), v('wid'));
      if (hole === 'round') { per = f.circlePerimeter(v('d')); const n = v('n') || 1; if (n > 1) { per = { value: per.value * n, step: { ...per.step, title: `ความยาวรอยตัด ${n} รู`, formula: String.raw`L = n\pi d`, sub: String.raw`L = ${n}\pi(${v('d')})`, value: per.value * n } }; } }
      if (hole === 'rect') per = { value: 2 * (v('a') + v('b2')), step: { id: 'perimeter', title: 'ความยาวรอยตัด (สี่เหลี่ยม)', formula: 'L = 2(a + b)', sub: `L = 2(${v('a')} + ${v('b2')})`, value: 2 * (v('a') + v('b2')), unit: 'mm' } };
      if (hole === 'line') per = { value: v('Lc'), step: null };
      if (per.step) steps.push(per.step);
      let Sss = v('Sss');
      if (s('sssmode') === 'uts') { steps.push({ id: 'sss', title: 'ประมาณ shear strength', formula: String.raw`S_{ss} \approx 0.7\,UTS`, sub: String.raw`S_{ss} = 0.7 \times ${Sss}`, value: 0.7 * Sss, unit: 'N/mm²' }); Sss *= 0.7; }
      const F = f.shearForce(t, per.value, Sss);
      steps.push(F.step);
      return `<div class="result-row"><div class="stat"><b>${fmtNum(c.value, 4)}</b>mm clearance</div><div class="stat"><b>${fmtNum(F.value / 1000, 2)}</b>kN แรงตัด</div></div>
        ${stepsHtml(steps)}<p class="step-explain">แรงตัด ${kN(F.value)} · ขนาด punch/die ต่างกัน 2c = ${fmtNum(2 * c.value, 4)} mm</p>`;
    },
  },
  cone: {
    form: () => `<div class="fields">${num('d', 'เส้นผ่านศูนย์กลางฐาน d (mm)', 100)}${num('Ha', 'ความสูงกรวย Hₐ (mm)', 120)}</div>`,
    calc() {
      const c = f.cone(v('d'), v('Ha'));
      const th = Math.min(c.theta, 359.9) * Math.PI / 180, r = 120, cx = 180, cy = 150;
      const x2 = cx + r * Math.sin(th - Math.PI / 2 + Math.PI / 2), y2 = cy - r * Math.cos(th);
      const large = c.theta > 180 ? 1 : 0;
      const svg = `<svg class="diagram" viewBox="0 0 360 290" role="img" aria-label="แผ่นคลี่รูปพัด"><path class="part" d="M${cx},${cy} L${cx},${cy - r} A${r},${r} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z"/><text x="${cx + 8}" y="${cy - r / 2}">R = ${fmtNum(c.R, 1)}</text><text x="${cx}" y="${cy + 24}" text-anchor="middle">θ = ${fmtNum(c.theta, 1)}°</text></svg>`;
      return `${svg}<div class="result-row"><div class="stat"><b>${fmtNum(c.R, 2)}</b>mm รัศมีแผ่นคลี่</div><div class="stat"><b>${fmtNum(c.theta, 2)}</b>° มุมพัด</div></div>${stepsHtml(c.steps)}`;
    },
  },
  heat: {
    form: () => `<div class="fields">${sel('proc', 'กระบวนการ (η)', Object.entries(f.ETA).map(([k, e]) => [k, `${k} (${e})`]), 'SMAW')}${num('I', 'กระแส I (A)', 100)}${num('Umin', 'แรงดันต่ำสุด (V)', 23)}${num('Umax', 'แรงดันสูงสุด (V)', 25, 'any', 'ถ้าค่าเดียวใส่เท่ากัน')}${num('vv', 'ความเร็วเดิน v (mm/min)', 120)}</div>`,
    calc() {
      const U = (v('Umin') + v('Umax')) / 2, eta = f.ETA[s('proc')];
      const Q = f.heatInput(U, v('I'), v('vv'), eta);
      const steps = [{ id: 'vavg', title: 'แรงดันเฉลี่ย', formula: String.raw`U = \dfrac{U_{min}+U_{max}}{2}`, sub: String.raw`U = \dfrac{${v('Umin')} + ${v('Umax')}}{2}`, value: U, unit: 'V' }, Q.step];
      return `<div class="result-row"><div class="stat"><b>${fmtNum(Q.value, 3)}</b>kJ/mm</div><div class="stat">ถ้าไม่คูณ η <b>${fmtNum(Q.raw, 3)}</b></div></div>${stepsHtml(steps)}`;
    },
  },
  duty: {
    form: () => `<div class="fields">${num('Ir', 'กระแสพิกัด (A)', 300)}${num('Dr', 'Duty cycle พิกัด (%)', 60)}${num('Iu', 'กระแสที่ใช้ (A)', 350)}</div>`,
    calc() {
      const d = f.dutyCycle(v('Ir'), v('Dr'), v('Iu'));
      return `<div class="result-row"><div class="stat"><b>${fmtNum(d.value, 2)}</b>%</div><div class="stat">เชื่อมได้ <b>${fmtNum(d.value / 10, 1)}</b> นาทีต่อ 10 นาที</div></div>${stepsHtml([d.step])}${d.rawValue > 100 ? '<p class="step-explain">ค่าที่คำนวณได้เกิน 100% จึงตัดที่ 100% (เชื่อมต่อเนื่องได้)</p>' : ''}`;
    },
  },
  u2: {
    form: () => `<div class="fields">${sel('p', 'กระบวนการ', Object.keys(f.U2_TABLE).map((k) => [k, k]), 'SMAW')}${num('I2', 'กระแสเชื่อม I₂ (A)', 150)}</div>`,
    calc() { const u = f.loadVoltage(s('p'), v('I2')); return `<div class="result-row"><div class="stat"><b>${fmtNum(u.value, 2)}</b>V</div></div>${stepsHtml([u.step])}`; },
  },
  rivet: {
    form: () => `<div class="fields">${num('T', 'ความหนาแผ่น (mm)', 1.6)}${sel('thick', 'ชนิดงาน', [[0, 'งานบาง (+1/32 นิ้ว)'], [1, 'งานหนา (+1/16 นิ้ว)']], 0)}</div>`,
    calc() {
      const rv = f.rivet(v('T'), s('thick') === '1');
      return `<div class="result-row"><div class="stat"><b>${fmtNum(rv.d, 4)}</b>นิ้ว หมุด (${fmtNum(rv.d * 25.4, 2)} mm)</div><div class="stat"><b>${fmtNum(rv.D, 4)}</b>นิ้ว รูเจาะ (${fmtNum(rv.D * 25.4, 2)} mm)</div></div>${stepsHtml(rv.steps)}`;
    },
  },
};

function render() {
  const V = VIEWS[tab];
  app.innerHTML = `<div class="calc-tabs seg" role="tablist">${TABS.map(([k, l]) => `<button class="seg-btn ${k === tab ? 'is-on' : ''}" role="tab" aria-selected="${k === tab}" data-tab="${k}">${l}</button>`).join('')}</div>
    <div class="calc-layout"><section class="panel" aria-label="ค่าที่ป้อน"><h2>ค่าที่ป้อน</h2>${V.form()}<p class="step-explain" style="margin-top:12px">หน่วย mm และ N/mm² ทั้งหมด ค่าเริ่มต้นคือโจทย์ข้อสอบ</p></section>
    <section class="panel" aria-live="polite" aria-label="ผลลัพธ์"><h2>ผลลัพธ์ทีละขั้น</h2><div id="calc-out"></div></section></div>`;
  if (tab === 'bend') { const fill = () => { $('#shape-fields', app).innerHTML = V.shapeFields[s('shape')](); }; fill(); $('#shape', app).addEventListener('change', () => { fill(); update(); }); }
  if (tab === 'cut') { const fill = () => { $('#hole-fields', app).innerHTML = V.holeFields[s('hole')](); }; fill(); $('#hole', app).addEventListener('change', () => { fill(); update(); }); }
  update();
}
function update() {
  const out = $('#calc-out', app);
  const bad = $$('input[type="number"]', app).some((i) => !Number.isFinite(parseFloat(i.value)));
  if (bad) { out.innerHTML = '<p class="feedback bad">กรอกตัวเลขให้ครบทุกช่อง</p>'; return; }
  try { out.innerHTML = VIEWS[tab].calc(); } catch (e) { out.innerHTML = `<p class="feedback bad">คำนวณไม่ได้: ${esc(e.message)}</p>`; }
}
app.addEventListener('input', (e) => { if (e.target.matches('input, select') && !e.target.matches('#shape, #hole')) update(); });
app.addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; history.replaceState(null, '', '#' + tab); render(); } });
render();
