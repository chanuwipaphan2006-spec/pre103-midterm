// สูตรของวิชา PRE103 (กลางภาค) ตามสไลด์อาจารย์
// ทุกฟังก์ชันคืน { value, unit, step } โดย step ใช้แสดง "สูตร → แทนค่า → ผลลัพธ์" บนเว็บ
// หน่วยภายใน: mm, N, N/mm², องศา, V, A, mm/min

const r = String.raw;
export const PI = Math.PI;

/** ปัดเลขสำหรับแสดงผล (ไม่ใช้ในการคำนวณต่อ) */
export function fmt(x, digits = 3) {
  if (!Number.isFinite(x)) return String(x);
  const abs = Math.abs(x);
  let d = digits;
  if (abs >= 1000) d = Math.min(digits, 1);
  else if (abs >= 100) d = Math.min(digits, 2);
  const s = x.toFixed(d);
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
}
export const num = (x, d) => fmt(x, d).replace(/\B(?=(\d{3})+(?!\d))/g, '{,}');

function step(id, title, formula, sub, value, unit, explain = '') {
  return { id, title, formula, sub, value, unit, explain };
}

// ---------- ข้อมูลตาราง ----------
export const AC_TABLE = [
  { key: 'al-soft', Ac: 0.045, label: 'อะลูมิเนียม 1100S, 5052S ทุก temper' },
  { key: 'soft', Ac: 0.060, label: 'อะลูมิเนียม 2024ST, 6061ST, ทองเหลือง, เหล็กรีดเย็นแบบอ่อน (รวม SS400), สเตนเลสอ่อน' },
  { key: 'hard', Ac: 0.075, label: 'เหล็กรีดเย็นครึ่งแข็ง, สเตนเลสครึ่งแข็งและแข็งเต็มที่' },
];
export const SSS_TABLE = { Aluminum: 172.4, Brass: 241.3, 'Low carbon steel': 344.7, 'Stainless steel': 517.1 }; // N/mm²
export const KBF = { V: 1.33, edge: 0.33 };
export const ETA = { SMAW: 0.75, GMAW: 0.90, SAW: 0.90, GTAW: 0.80 };
export const U2_TABLE = {
  SMAW: { a: 20, b: 0.04, Imax: 600, Umax: 44 },
  SAW: { a: 20, b: 0.04, Imax: 600, Umax: 44 },
  GTAW: { a: 10, b: 0.04, Imax: 600, Umax: 34 },
  GMAW: { a: 14, b: 0.05, Imax: 600, Umax: 44 }, // สไลด์เขียน 540 A ซึ่งน่าจะพิมพ์ผิด ดูหมายเหตุในบทเรียน
};

// ---------- Sheet metal ----------
export function clearance(Ac, t) {
  const c = Ac * t;
  return { value: c, unit: 'mm', step: step('clearance', 'Clearance', r`c = A_c\,t`, r`c = ${Ac} \times ${fmt(t)}`, c, 'mm',
    'ระยะห่างระหว่างขอบ punch กับขอบ die (ด้านเดียว)') };
}

export function slotPerimeter(length, width) {
  const L = 2 * (length - width) + PI * width;
  return { value: L, unit: 'mm', step: step('perimeter', 'ความยาวรอยตัด (รูยาวปลายมน)', r`L = 2(\ell - w) + \pi w`,
    r`L = 2(${fmt(length)} - ${fmt(width)}) + \pi(${fmt(width)})`, L, 'mm',
    'ส่วนตรงสองเส้นยาวเส้นละ ℓ − w และปลายครึ่งวงกลมสองข้างรวมเป็นวงกลมเต็ม πw') };
}
export function circlePerimeter(d) {
  const L = PI * d;
  return { value: L, unit: 'mm', step: step('perimeter', 'ความยาวรอยตัด (รูกลม)', r`L = \pi d`, r`L = \pi(${fmt(d)})`, L, 'mm') };
}

export function shearForce(t, L, Sss) {
  const F = t * L * Sss;
  return { value: F, unit: 'N', step: step('shear', 'แรงตัดเฉือน', r`F = t\,L\,S_{ss}`,
    r`F = ${fmt(t)} \times ${fmt(L)} \times ${fmt(Sss)}`, F, 'N', 'พื้นที่ที่ถูกเฉือน (L × t) คูณ shear strength') };
}

export function kba(R, t) {
  const k = R < 2 * t ? 0.33 : 0.50;
  return { value: k, unit: '', step: step('kba', 'เลือก K_ba', r`K_{ba} = \begin{cases}0.33 & R < 2t\\ 0.50 & R \ge 2t\end{cases}`,
    r`R = ${fmt(R)},\ 2t = ${fmt(2 * t)} \Rightarrow R ${R < 2 * t ? '<' : r`\ge`} 2t`, k, '',
    R < 2 * t ? 'พับแคบ แกนสะเทินเลื่อนเข้าหาผิวใน' : 'พับกว้าง แกนสะเทินอยู่กลางความหนา') };
}

export function bendAllowance(A, R, t, K = kba(R, t).value) {
  const BA = 2 * PI * (A / 360) * (R + K * t);
  return { value: BA, unit: 'mm', step: step('ba', 'Bend allowance', r`BA = 2\pi\left(\tfrac{A}{360}\right)(R + K_{ba}t)`,
    r`BA = 2\pi\left(\tfrac{${fmt(A)}}{360}\right)(${fmt(R)} + ${K}\times${fmt(t)})`, BA, 'mm', 'ความยาวโค้งของแกนสะเทินตรงมุมพับ') };
}

/**
 * ความยาวช่วงตรงจากขนาดในแบบ (พับ 90°)
 * ends: 'free' ปลายอิสระ, 'out' ขนาดวัดถึงผิวนอกของมุมพับ (หัก R+t), 'in' วัดถึงผิวใน (หัก R)
 */
export function flatSegment(name, dim, endA, endB, R, t) {
  const cut = (e) => (e === 'out' ? R + t : e === 'in' ? R : 0);
  const cuts = [cut(endA), cut(endB)];
  const L = dim - cuts[0] - cuts[1];
  const parts = cuts.filter((c) => c > 0).map((c) => ` - ${fmt(c)}`).join('');
  return { name, dim, endA, endB, value: L, sub: r`${fmt(dim)}${parts}` };
}

export function blankLength(segments, nBends, BA) {
  const sumL = segments.reduce((s, x) => s + x.value, 0);
  const sumBA = nBends * BA;
  const Lb = sumL + sumBA;
  return {
    value: Lb, unit: 'mm', sumL, sumBA,
    step: step('lb', 'ความยาวแผ่นก่อนพับ (True size)', r`L_b = \sum L + \sum BA`,
      r`L_b = ${fmt(sumL)} + ${nBends}(${fmt(BA)})`, Lb, 'mm', 'ช่วงตรงทั้งหมด + bend allowance ทุกมุม'),
  };
}

export function bendForce(Kbf, UTS, L, t, W) {
  const F = (Kbf * UTS * L * t * t) / W;
  return { value: F, unit: 'N', step: step('bend', 'แรงพับ', r`F = \dfrac{K_{bf}\,UTS\,L\,t^2}{W}`,
    r`F = \dfrac{${Kbf}\times${fmt(UTS)}\times${fmt(L)}\times${fmt(t)}^2}{${fmt(W)}}`, F, 'N', 'L คือความยาวแนวพับ (ความกว้างชิ้นงานตามแกนพับ)') };
}

export function springback(alphaPart, alphaTool) {
  const SB = (alphaPart - alphaTool) / alphaTool;
  return { value: SB, unit: '', step: step('sb', 'Springback', r`SB = \dfrac{\alpha' - \alpha_b'}{\alpha_b'}`,
    r`SB = \dfrac{${fmt(alphaPart)} - ${fmt(alphaTool)}}{${fmt(alphaTool)}}`, SB, '') };
}

export function cone(d, Ha) {
  const R = Math.sqrt(Ha * Ha + (d / 2) ** 2);
  const theta = (180 * d) / R;
  return {
    R, theta,
    steps: [
      step('coneR', 'ความยาวเอียง (รัศมีแผ่นคลี่)', r`R = \sqrt{H_a^2 + (d/2)^2}`, r`R = \sqrt{${fmt(Ha)}^2 + ${fmt(d / 2)}^2}`, R, 'mm', 'พีทาโกรัส'),
      step('coneTheta', 'มุมของแผ่นคลี่', r`\theta = \dfrac{180^\circ\,d}{R}`, r`\theta = \dfrac{180 \times ${fmt(d)}}{${fmt(R)}}`, theta, '°', 'ความยาวโค้ง Rθ = เส้นรอบวงฐาน πd'),
    ],
  };
}

export function rivet(Tmm, thick = false) {
  const T = Tmm / 25.4;
  const d = 1.25 * Math.sqrt(T);
  const D = d + (thick ? 1 / 16 : 1 / 32);
  return {
    d, D, T,
    steps: [
      step('toInch', 'แปลงความหนาเป็นนิ้ว', r`T = \dfrac{T_{mm}}{25.4}`, r`T = \dfrac{${fmt(Tmm)}}{25.4}`, T, 'in'),
      step('rivetD', 'ขนาดหมุด', r`d = 1.25\sqrt{T}`, r`d = 1.25\sqrt{${fmt(T, 4)}}`, d, 'in'),
      step('hole', 'ขนาดรูเจาะ', thick ? r`D = d + \tfrac{1}{16}` : r`D = d + \tfrac{1}{32}`, r`D = ${fmt(d, 4)} + ${thick ? '0.0625' : '0.03125'}`, D, 'in'),
    ],
  };
}

export function stretchForce(L, t, Yf) {
  const F = L * t * Yf;
  return { value: F, unit: 'N', step: step('stretch', 'แรง stretch forming', r`F = L\,t\,Y_f`, r`F = ${fmt(L)}\times${fmt(t)}\times${fmt(Yf)}`, F, 'N') };
}

// ---------- Welding ----------
export function heatInput(U, I, v, eta = 1) {
  const raw = (U * I * 60) / (v * 1000);
  const Q = raw * eta;
  return {
    value: Q, raw, unit: 'kJ/mm',
    step: step('heat', 'Heat input', r`Q = \dfrac{U \times I \times 60}{v \times 1000}\times\eta`,
      r`Q = \dfrac{${fmt(U)} \times ${fmt(I)} \times 60}{${fmt(v)} \times 1000}\times${eta}`, Q, 'kJ/mm', 'พลังงานอาร์กต่อความยาวรอยเชื่อม คูณส่วนที่เข้าชิ้นงานจริง'),
  };
}

export function dutyCycle(Irated, DCrated, Iuse) {
  const DC = DCrated * (Irated / Iuse) ** 2;
  return { value: Math.min(DC, 100), rawValue: DC, unit: '%', step: step('duty', 'Duty cycle', r`DC = DC_{rated}\left(\dfrac{I_{rated}}{I_{use}}\right)^2`,
    r`DC = ${fmt(DCrated)}\left(\dfrac{${fmt(Irated)}}{${fmt(Iuse)}}\right)^2`, Math.min(DC, 100), '%', 'ความร้อนในเครื่อง ∝ I²t จึงให้ I² × เวลา คงที่') };
}

export function loadVoltage(process, I) {
  const p = U2_TABLE[process];
  const capped = I >= p.Imax;
  const U = capped ? p.Umax : p.a + p.b * I;
  return { value: U, unit: 'V', step: step('u2', `แรงดันขณะเชื่อม (${process})`, r`U_2 = ${p.a} + ${p.b}\,I_2`,
    capped ? r`I_2 \ge ${p.Imax} \Rightarrow U_2 = ${p.Umax}` : r`U_2 = ${p.a} + ${p.b}\times${fmt(I)}`, U, 'V') };
}

export function resistanceHeat(I, R, t) {
  const H = I * I * R * t;
  return { value: H, unit: 'J', step: step('rsw', 'ความร้อนจากความต้านทาน', r`H = I^2 R\,t`, r`H = ${fmt(I)}^2 \times ${R} \times ${fmt(t)}`, H, 'J') };
}

/** ใช้ในโหมดทำทีละขั้น: รายการสูตรให้ผู้เรียนเลือก */
export const FORMULA_CHOICES = {
  clearance: r`c = A_c\,t`,
  perimeter: r`L = 2(\ell - w) + \pi w`,
  shear: r`F = t\,L\,S_{ss}`,
  kba: r`K_{ba}: 0.33\ (R<2t),\ 0.50\ (R\ge 2t)`,
  ba: r`BA = 2\pi\tfrac{A}{360}(R + K_{ba}t)`,
  flat: r`L_{flat} = \text{ขนาด} - (R+t)_{\text{ผิวนอก}} - R_{\text{ผิวใน}}`,
  lb: r`L_b = \sum L + \sum BA`,
  bend: r`F = \tfrac{K_{bf}\,UTS\,L\,t^2}{W}`,
  heat: r`Q = \tfrac{U I 60}{v\,1000}\,\eta`,
  vavg: r`U = \tfrac{U_{min} + U_{max}}{2}`,
  duty: r`DC = DC_r (I_r/I)^2`,
  u2: r`U_2 = a + b\,I_2`,
  stretch: r`F = L\,t\,Y_f`,
  coneR: r`R = \sqrt{H_a^2 + (d/2)^2}`,
  coneTheta: r`\theta = 180^\circ d / R`,
};
