// บันทึก "ดูแล้ว" พร้อมเวลา เก็บในเบราว์เซอร์ของผู้ใช้เท่านั้น
// คีย์: L:<lesson>:<section-id> หัวข้อบทเรียน · Q:<paper>:<no> ข้อสอบ · F:<n> การ์ด · P:<file> หน้าเครื่องมือ
const KEY = 'pre103-seen';
const TKEY = 'pre103-time';

function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} }

export function all() { return load(); }
export function get(key) { return load()[key] || null; }
export function count(prefix) { return Object.keys(load()).filter((k) => k.startsWith(prefix)).length; }

/** บันทึกว่าดูแล้ว (ครั้งแรกเก็บ first ทุกครั้งอัปเดต last) คืนค่ารายการ */
export function mark(key, meta = {}) {
  const v = load();
  const now = Date.now();
  v[key] = { ...(v[key] || { first: now }), ...meta, last: now };
  save(v);
  dispatchEvent(new CustomEvent('seen:change', { detail: { key, item: v[key] } }));
  return v[key];
}
export function unmark(key) {
  const v = load();
  delete v[key];
  save(v);
  dispatchEvent(new CustomEvent('seen:change', { detail: { key, item: null } }));
}
export function clearAll() {
  try { localStorage.removeItem(KEY); localStorage.removeItem(TKEY); localStorage.removeItem('pre103-progress'); } catch {}
  dispatchEvent(new CustomEvent('seen:change', { detail: { key: '*', item: null } }));
}

const TH_MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const pad = (n) => String(n).padStart(2, '0');
/** "วันนี้ 14:32" / "เมื่อวาน 09:10" / "2 ต.ค. 14:32" */
export function when(ts) {
  const d = new Date(ts), now = new Date();
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86400000);
  if (diff === 0) return `วันนี้ ${hm}`;
  if (diff === 1) return `เมื่อวาน ${hm}`;
  return `${d.getDate()} ${TH_MONTH[d.getMonth()]} ${hm}`;
}
export function fullTime(ts) {
  const d = new Date(ts);
  return `${d.getDate()} ${TH_MONTH[d.getMonth()]} ${d.getFullYear() + 543} เวลา ${pad(d.getHours())}:${pad(d.getMinutes())} น.`;
}

/** ป้าย "ดูแล้ว" สีเขียว จุดกระพริบ แตะเพื่อยกเลิก */
export function badge(key, item) {
  return `<button class="seen" type="button" data-unseen="${key}" title="ดูแล้วเมื่อ ${fullTime(item.last)} (ครั้งแรก ${fullTime(item.first)}) · แตะเพื่อทำเครื่องหมายว่ายังไม่ได้ดู"><i class="dot live" aria-hidden="true"></i>ดูแล้ว <time datetime="${new Date(item.last).toISOString()}">${when(item.last)}</time></button>`;
}

// ---------- เวลาที่ใช้เรียน (นับเฉพาะตอนเปิดหน้าอยู่และมีการขยับ) ----------
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export function studyTime() { try { return JSON.parse(localStorage.getItem(TKEY)) || {}; } catch { return {}; } }
export function addStudySeconds(s) {
  const t = studyTime();
  t[today()] = (t[today()] || 0) + s;
  try { localStorage.setItem(TKEY, JSON.stringify(t)); } catch {}
}
export const todayKey = today;
export function minutesText(sec) {
  const m = Math.round(sec / 60);
  if (m < 1) return 'ไม่ถึง 1 นาที';
  if (m < 60) return `${m} นาที`;
  return `${Math.floor(m / 60)} ชม. ${m % 60} นาที`;
}
