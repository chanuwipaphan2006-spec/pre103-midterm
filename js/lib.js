// ตัวช่วยที่หน้าโต้ตอบใช้ร่วมกัน
import katex from '../vendor/katex/katex.mjs';

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];

export function tex(s, display = false) {
  try { return katex.renderToString(s, { displayMode: display, throwOnError: false, strict: 'ignore' }); }
  catch { return `<code>${esc(s)}</code>`; }
}
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** ข้อความที่มี $...$ ปนอยู่ → HTML */
export function mixed(s) {
  return esc(s).replace(/\$([^$]+)\$/g, (_, m) => tex(m.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')));
}

export function pageData() {
  const el = document.getElementById('page-data');
  return el ? JSON.parse(el.textContent) : {};
}

const KEY = 'pre103-progress';
export const store = {
  get() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } },
  set(patch) { try { const v = { ...store.get(), ...patch }; localStorage.setItem(KEY, JSON.stringify(v)); return v; } catch { return {}; } },
};

/** ตัวเลขสำหรับแสดงผล */
export function fmtNum(x, d = 3) {
  if (!Number.isFinite(x)) return '–';
  const a = Math.abs(x);
  const digits = a >= 1000 ? 1 : a >= 100 ? 2 : d;
  return Number(x.toFixed(digits)).toLocaleString('en-US', { maximumFractionDigits: digits });
}

/** แสดงขั้นตอน สูตร → แทนค่า → ผลลัพธ์ */
export function stepsHtml(steps) {
  return `<ol class="steps">${steps.map((s) => `
    <li class="step">
      <div class="step-title">${esc(s.title)}</div>
      <div class="step-math">${tex(s.formula, true)}${tex(`${s.sub} = ${unitTex(s.value, s.unit)}`, true)}</div>
      ${s.explain ? `<div class="step-explain">${esc(s.explain)}</div>` : ''}
    </li>`).join('')}</ol>`;
}
export function unitTex(v, unit) {
  const n = fmtNum(v).replace(/,/g, '{,}');
  if (!unit) return `\\mathbf{${n}}`;
  return `\\mathbf{${n}}\\ \\text{${unit.replace(/%/g, '\\%')}}`;
}

/** ตรวจค่าที่ผู้เรียนพิมพ์ (ยอมคลาดเคลื่อน 1% หรือปัดเศษ) */
export function checkNum(input, want, rel = 0.01) {
  const v = parseFloat(String(input).replace(/,/g, ''));
  if (!Number.isFinite(v)) return null;
  return Math.abs(v - want) <= Math.max(rel * Math.abs(want), 0.005);
}

export function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
