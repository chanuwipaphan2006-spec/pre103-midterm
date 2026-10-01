// โจทย์ตัวอย่างของอาจารย์และข้อสอบเก่า สร้างขั้นตอนเฉลยจาก formulas.js
// ทุกโจทย์รับ params ได้ (ใช้ซ้ำในเครื่องคำนวณและแบบทดสอบสุ่มตัวเลข)
import * as f from './formulas.js';

const r = String.raw;
const flatStep = (seg, t, R) => ({
  id: 'flat', title: `ช่วงตรง: ${seg.name}`,
  formula: r`L = \text{ขนาดในแบบ} - (R+t)_{\text{ผิวนอก}} - R_{\text{ผิวใน}}`,
  sub: r`L = ${seg.sub}`, value: seg.value, unit: 'mm',
  explain: [seg.endA, seg.endB].map((e) => (e === 'out' ? `ปลายวัดถึงผิวนอก หัก R+t = ${f.fmt(R + t)}` : e === 'in' ? `ปลายวัดถึงผิวใน หัก R = ${f.fmt(R)}` : 'ปลายอิสระ ไม่หัก')).join(' · '),
});

/** ชิ้นงานรูปหมวก (ข้อสอบ 2/2563, แนว 2567) */
export function hat(p = {}) {
  const P = { t: 1.5, R: 1.5, totalW: 120, H: 20, crown: 57, width: 125, W: 10, UTS: 480, Sss: 300, Ac: 0.060, slotLen: 25, slotW: 12, ...p };
  const { t, R } = P;
  const flangeDim = (P.totalW - P.crown) / 2;
  const segs = [
    f.flatSegment('ปีกซ้าย', flangeDim, 'free', 'in', R, t),
    f.flatSegment('ผนังซ้าย', P.H, 'out', 'out', R, t),
    f.flatSegment('หลังคา', P.crown, 'out', 'out', R, t),
    f.flatSegment('ผนังขวา', P.H, 'out', 'out', R, t),
    f.flatSegment('ปีกขวา', flangeDim, 'in', 'free', R, t),
  ];
  const K = f.kba(R, t);
  const BA = f.bendAllowance(90, R, t, K.value);
  const Lb = f.blankLength(segs, 4, BA.value);
  const c = f.clearance(P.Ac, t);
  const per = f.slotPerimeter(P.slotLen, P.slotW);
  const Fs = f.shearForce(t, per.value, P.Sss);
  const Fb = f.bendForce(f.KBF.V, P.UTS, P.width, t, P.W);
  const flangeStep = { id: 'geom', title: 'ระยะปีก (ปลายปีกถึงผิวนอกผนัง)', formula: r`\dfrac{\text{กว้างรวม} - \text{ระยะผนัง}}{2}`,
    sub: r`\dfrac{${P.totalW} - ${P.crown}}{2}`, value: flangeDim, unit: 'mm', explain: 'ชิ้นงานสมมาตร' };
  return {
    id: 'hat', title: 'ชิ้นงานรูปหมวก 4 มุมพับ', params: P,
    parts: {
      lb: [K.step, BA.step, flangeStep, ...segs.map((s) => flatStep(s, t, R)), Lb.step],
      shear: [c.step, per.step, Fs.step],
      bend: [Fb.step],
    },
    answers: { kba: K.value, BA: BA.value, Lb: Lb.value, sumL: Lb.sumL, clearance: c.value, perimeter: per.value, Fshear: Fs.value, Fbend: Fb.value },
    summary: r`\text{ขนาดแผ่น } ${f.fmt(t)} \times ${f.fmt(P.width)} \times ${f.fmt(Lb.value, 2)}\ \text{mm}`,
  };
}

/** รางตัว U คว่ำ 2 มุมพับ (ข้อสอบ 2/2562) */
export function uChannel(p = {}) {
  const P = { t: 3, R: 3, span: 150, leg: 25, width: 100, W: 30, UTS: 480, Sss: 300, Ac: 0.060, ...p };
  const { t, R } = P;
  const segs = [
    f.flatSegment('ขาซ้าย', P.leg, 'free', 'out', R, t),
    f.flatSegment('หลังคา (150 วัดผิวนอกซ้ายถึงผิวในขวา)', P.span, 'out', 'in', R, t),
    f.flatSegment('ขาขวา', P.leg, 'out', 'free', R, t),
  ];
  const K = f.kba(R, t);
  const BA = f.bendAllowance(90, R, t, K.value);
  const Lb = f.blankLength(segs, 2, BA.value);
  const c = f.clearance(P.Ac, t);
  const Fs = f.shearForce(t, Lb.value, P.Sss);
  Fs.step.title = 'แรงตัดเฉือนสูงสุด (ตัดตามขอบยาวที่สุด L = L_b)';
  const Fb = f.bendForce(f.KBF.V, P.UTS, P.width, t, P.W);
  return {
    id: 'uchannel', title: 'รางตัว U คว่ำ 2 มุมพับ', params: P,
    parts: { lb: [K.step, BA.step, ...segs.map((s) => flatStep(s, t, R)), Lb.step], forces: [c.step, Fs.step, Fb.step] },
    answers: { kba: K.value, BA: BA.value, Lb: Lb.value, sumL: Lb.sumL, clearance: c.value, Fshear: Fs.value, Fbend: Fb.value },
    summary: r`\text{ขนาดแผ่น } ${f.fmt(t)} \times ${f.fmt(P.width)} \times ${f.fmt(Lb.value, 2)}\ \text{mm}`,
  };
}

/** ตัว L จากสไลด์ 23 */
export function lBracket(p = {}) {
  const P = { t: 1.5, R: 1.5, a: 35, b: 8, width: 150, UTS: 480, W: 10, ...p };
  const { t, R } = P;
  const segs = [f.flatSegment('ขายาว', P.a, 'free', 'out', R, t), f.flatSegment('ขาสั้น', P.b, 'out', 'free', R, t)];
  const K = f.kba(R, t);
  const BA = f.bendAllowance(90, R, t, K.value);
  const Lb = f.blankLength(segs, 1, BA.value);
  const Fb = f.bendForce(f.KBF.V, P.UTS, P.width, t, P.W);
  return {
    id: 'lbracket', title: 'แผ่นพับตัว L (สไลด์ 23)', params: P,
    parts: { lb: [K.step, BA.step, ...segs.map((s) => flatStep(s, t, R)), Lb.step], bend: [Fb.step] },
    answers: { BA: BA.value, Lb: Lb.value, Fbend: Fb.value, slideLb: P.a + (P.b - R - t) + BA.value },
    summary: r`\text{ขนาดแผ่น } ${f.fmt(t)} \times ${f.fmt(P.width)} \times ${f.fmt(Lb.value, 2)}\ \text{mm}`,
  };
}

/** Heat input ข้อสอบ (2563, 2564, 2567) */
export function heatExam(p = {}) {
  const P = { I: 100, Umin: 23, Umax: 25, v: 120, eta: 0.75, ...p };
  const U = (P.Umin + P.Umax) / 2;
  const Q = f.heatInput(U, P.I, P.v, P.eta);
  return {
    id: 'heat', title: 'Heat input', params: P,
    parts: {
      all: [
        { id: 'vavg', title: 'แรงดันเฉลี่ย', formula: r`U = \dfrac{U_{min} + U_{max}}{2}`, sub: r`U = \dfrac{${P.Umin} + ${P.Umax}}{2}`, value: U, unit: 'V', explain: 'โจทย์ให้เป็นช่วง ใช้ค่ากลาง' },
        Q.step,
      ],
    },
    answers: { U, Q: Q.value, raw: Q.raw, Qmin: f.heatInput(P.Umin, P.I, P.v, P.eta).value, Qmax: f.heatInput(P.Umax, P.I, P.v, P.eta).value },
  };
}

export function dutyExample(p = {}) {
  const P = { Irated: 300, DCrated: 60, Iuse: 350, ...p };
  const d = f.dutyCycle(P.Irated, P.DCrated, P.Iuse);
  return { id: 'duty', title: 'Duty cycle (สไลด์ 84)', params: P, parts: { all: [d.step] }, answers: { DC: d.value } };
}

export function coneExample(p = {}) {
  const P = { d: 100, Ha: 120, ...p };
  const c = f.cone(P.d, P.Ha);
  return { id: 'cone', title: 'แผ่นคลี่กรวย', params: P, parts: { all: c.steps }, answers: { R: c.R, theta: c.theta } };
}

export const PROBLEMS = {
  'hat-2563': hat,
  'uchannel-2562': uChannel,
  'lbracket-s23': lBracket,
  'heat-input-exam': heatExam,
  'duty-s84': dutyExample,
  cone: coneExample,
};
