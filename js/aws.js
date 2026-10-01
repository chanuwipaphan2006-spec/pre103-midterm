// ฝึกอ่านสัญลักษณ์ AWS + รูปคำตอบสไลด์ 27 + ถอดรหัสลวดเชื่อม
import { $, $$, esc, pick, shuffle } from './lib.js';

const app = $('#aws-app');
const TYPES = {
  fillet: 'Fillet (รอยเชื่อมมุม)',
  v: 'V-groove (ร่องตัว V)',
  bevel: 'Bevel groove (บากด้านเดียว)',
  square: 'Square groove (ร่องตรง)',
  plug: 'Plug / Slot',
  spot: 'Spot (จุด)',
};
const SIDES = { arrow: 'Arrow side (ด้านลูกศร)', other: 'Other side (ด้านตรงข้าม)', both: 'Both sides (ทั้งสองด้าน)' };

// วาดสัญลักษณ์หนึ่งตัวที่ x บนเส้นอ้างอิง y, dir = +1 ใต้เส้น (arrow side), -1 เหนือเส้น
function glyph(type, x, y, dir) {
  const d = dir * 26;
  switch (type) {
    case 'fillet': return `<path class="sym" d="M${x - 12},${y} L${x - 12},${y + d} L${x + 14},${y}"/>`;
    case 'v': return `<path class="sym" d="M${x - 16},${y + d} L${x},${y} L${x + 16},${y + d}"/>`;
    case 'bevel': return `<path class="sym" d="M${x - 8},${y} L${x - 8},${y + d} M${x - 8},${y} L${x + 14},${y + d}"/>`;
    case 'square': return `<path class="sym" d="M${x - 6},${y} L${x - 6},${y + d} M${x + 6},${y} L${x + 6},${y + d}"/>`;
    case 'plug': return `<rect class="sym" x="${x - 14}" y="${dir > 0 ? y : y - 16}" width="28" height="16"/>`;
    case 'spot': return `<circle class="sym" cx="${x}" cy="${y + dir * 11}" r="11"/>`;
  }
  return '';
}
function symbolSvg({ type, side, size = '', tail = '' }) {
  const y = 120, x0 = 170, x1 = 470, xs = 320;
  let g = '';
  if (side === 'arrow' || side === 'both') g += glyph(type, xs, y, 1);
  if (side === 'other' || side === 'both') g += glyph(type, xs, y, -1);
  const sizeTxt = size ? `<text x="${xs - 34}" y="${side === 'other' ? y - 10 : y + 22}" text-anchor="end">${size}</text>` : '';
  return `<svg class="aws-svg" viewBox="0 0 560 230" role="img" aria-label="สัญลักษณ์งานเชื่อม">
    <path class="ln" d="M${x0},${y} L${x1},${y}"/>
    <path class="ln" d="M${x0},${y} L80,205"/><path class="symf" d="M80,205 l2,-16 l11,8 z"/>
    ${tail ? `<path class="ln" d="M${x1},${y} l18,-14 M${x1},${y} l18,14"/><text x="${x1 + 26}" y="${y + 5}">${tail}</text>` : ''}
    ${g}${sizeTxt}
    <text class="lbl" x="${xs}" y="${y + 70}" text-anchor="middle">เส้นอ้างอิง (reference line)</text>
    <text class="lbl" x="70" y="222">ลูกศรชี้รอยต่อ</text>
  </svg>`;
}

// รูปคำตอบข้อสอบ (สไลด์ 27): ลูกศรเดียว เส้นอ้างอิงสองเส้น
const seqSvg = `<svg class="aws-svg" viewBox="0 0 560 260" role="img" aria-label="สัญลักษณ์ลำดับการเชื่อม: ขั้นแรก V ด้านลูกศร 3/4 มุม 60 องศา GTSM ขั้นสอง V ด้านตรงข้าม 1/2 มุม 55 องศา CJP">
  <path class="ln" d="M170,170 L470,170"/><path class="ln" d="M210,90 L470,90"/>
  <path class="ln" d="M210,90 L170,170 L90,240"/><path class="symf" d="M90,240 l3,-16 l11,9 z"/>
  <path class="sym" d="M314,196 L330,170 L346,196"/>
  <text x="300" y="194" text-anchor="end">3/4</text><text x="330" y="214" text-anchor="middle">1/16</text><text x="330" y="232" text-anchor="middle">60°</text>
  <path class="ln" d="M470,170 l18,-14 M470,170 l18,14"/><text x="496" y="175">GTSM</text>
  <path class="sym" d="M314,64 L330,90 L346,64"/>
  <text x="300" y="80" text-anchor="end">1/2</text><text x="330" y="52" text-anchor="middle">55°</text>
  <path class="ln" d="M470,90 l18,-14 M470,90 l18,14"/><text x="496" y="95">CJP</text>
  <text class="lbl" x="110" y="166">ขั้นที่ 1 (ใกล้หัวลูกศร)</text><text class="lbl" x="214" y="84">ขั้นที่ 2</text>
</svg>`;

// ---------- ถอดรหัสลวด ----------
const FLUX = { 10: 'Cellulosic (ซึมลึก) DCEP', 11: 'Cellulosic ใช้ AC/DC', 12: 'Rutile', 13: 'Rutile ใช้ AC/DC อาร์กนิ่ม', 16: 'Basic (low hydrogen)', 18: 'Basic iron powder (low hydrogen)', 20: 'Acid (iron oxide)', 24: 'Rutile iron powder', 27: 'Acid iron powder', 28: 'Basic iron powder (low hydrogen)' };
const POS = { 1: 'เชื่อมได้ทุกท่า', 2: 'ท่าราบและท่าขนานนอนเท่านั้น', 4: 'ทุกท่า รวมท่าตั้งเชื่อมลง (vertical down)' };
function decode(code) {
  const c = code.trim().toUpperCase().replace(/\s+/g, '');
  let m;
  if ((m = c.match(/^ER(\d{2,3})S-?(\w+)$/))) return { proc: 'GMAW (MIG/MAG) หรือลวดเติม GTAW', rows: [['ER', 'Electrode หรือ Rod ใช้เป็นลวดป้อนหรือลวดเติมได้'], [m[1], `ความต้านแรงดึงต่ำสุด ${m[1]} ksi (≈ ${Math.round(+m[1] * 6.895)} MPa)`], ['S', 'Solid wire ลวดตัน (เปลือย)'], [m[2], 'ส่วนผสมเคมี เช่น -6 มี Mn และ Si สูง ช่วยกำจัดออกซิเจน']] };
  if ((m = c.match(/^E(\d{2,3})(\d)T-?(\w+)$/))) return { proc: 'FCAW (ลวดไส้ฟลักซ์)', rows: [['E', 'Electrode'], [m[1], `ความต้านแรงดึงต่ำสุด ${m[1]} ksi`], [m[2], m[2] === '0' ? 'ท่าราบและท่าขนานนอน' : 'ทุกท่า'], ['T', 'Tubular ลวดเป็นหลอด มีฟลักซ์ข้างใน'], [m[3], 'ชนิดการใช้งานและก๊าซปกคลุม']] };
  if ((m = c.match(/^E(\d{2,3})(\d)(\d)$/))) {
    const flux = FLUX[+(m[2] + m[3])];
    return { proc: 'SMAW (ลวดหุ้มฟลักซ์)', rows: [['E', 'Electrode ลวดเชื่อมไฟฟ้า'], [m[1], `ความต้านแรงดึงต่ำสุดของเนื้อเชื่อม ${m[1]} ksi (≈ ${Math.round(+m[1] * 6.895)} MPa)`], [m[2], POS[m[2]] || 'ไม่มีในตารางสไลด์'], [m[2] + m[3], flux ? `ชนิดฟลักซ์: ${flux}` : 'ไม่มีในตารางสไลด์ 57']] };
  }
  return null;
}

// ---------- ฝึกอ่าน ----------
let cur = null;
function newSymbol() {
  const type = pick(Object.keys(TYPES));
  const side = type === 'spot' || type === 'plug' ? pick(['arrow', 'other']) : pick(['arrow', 'other', 'both']);
  cur = { type, side, size: type === 'fillet' ? pick(['6', '1/4', '3/8']) : '', got: {} };
  $('#drill-svg').innerHTML = symbolSvg(cur);
  $('#drill-type').innerHTML = shuffle(Object.keys(TYPES)).slice(0, 6).map((k) => `<button class="opt" data-ty="${k}">${TYPES[k]}</button>`).join('');
  $('#drill-side').innerHTML = Object.keys(SIDES).map((k) => `<button class="opt" data-si="${k}">${SIDES[k]}</button>`).join('');
  $('#drill-fb').innerHTML = '';
}
function checkDone() {
  if (!('ty' in cur.got && 'si' in cur.got)) return;
  const ok = cur.got.ty && cur.got.si;
  $('#drill-fb').innerHTML = `<div class="answer ${ok ? '' : 'is-warn'}"><div class="lbl">${ok ? 'ถูกทั้งสองข้อ' : 'ยังไม่ครบ'}</div>${TYPES[cur.type]} · ${SIDES[cur.side]}<div class="why">สัญลักษณ์อยู่${cur.side === 'arrow' ? 'ใต้เส้น จึงเชื่อมด้านที่ลูกศรชี้' : cur.side === 'other' ? 'เหนือเส้น จึงเชื่อมด้านตรงข้ามลูกศร' : 'ทั้งบนและล่างเส้น จึงเชื่อมทั้งสองด้าน'}</div></div>`;
}

app.innerHTML = `
  <section class="panel" style="margin-bottom:16px"><h2>1. ฝึกอ่านสัญลักษณ์</h2>
    <p class="step-explain">กฎสำคัญ: สัญลักษณ์ใต้เส้นอ้างอิง = เชื่อมด้านลูกศร เหนือเส้น = ด้านตรงข้าม</p>
    <div id="drill-svg"></div>
    <h3>ชนิดรอยเชื่อม</h3><div class="opts" id="drill-type"></div>
    <h3>ด้านที่เชื่อม</h3><div class="opts" id="drill-side"></div>
    <div id="drill-fb" aria-live="polite"></div>
    <p><button class="btn btn-primary" id="drill-next" type="button">สุ่มสัญลักษณ์ใหม่</button></p>
  </section>
  <section class="panel" id="seq" style="margin-bottom:16px"><h2>2. คำตอบข้อสอบ "เขียนสัญลักษณ์แสดงลำดับการเชื่อม" (สไลด์ 27)</h2>
    ${seqSvg}
    <ul class="step-explain" style="line-height:1.8"><li>เส้นอ้างอิงที่ <b>ใกล้หัวลูกศรที่สุด</b> คือขั้นตอนแรก</li><li>ขั้นที่ 1 ด้านลูกศร (V ใต้เส้น): ลึก 3/4 root opening 1/16 มุม 60° หางเขียน GTSM (เซาะถึงเนื้อดีก่อนเชื่อมด้านที่สอง)</li><li>ขั้นที่ 2 ด้านตรงข้าม (V เหนือเส้น): ลึก 1/2 มุม 55° หางเขียน CJP (ซึมเต็มความหนา)</li></ul>
  </section>
  <section class="panel"><h2>3. ถอดรหัสลวดเชื่อม</h2>
    <div class="num-row"><label for="code">รหัสลวด</label><input id="code" type="text" value="E6013" autocomplete="off" style="width:180px;text-transform:uppercase">
    ${['E6013', 'E7016', 'E7018', 'E6010', 'ER70S-6', 'E71T-1'].map((c) => `<button class="btn btn-sm" data-code="${c}">${c}</button>`).join('')}</div>
    <div id="decode" class="decode" aria-live="polite"></div>
  </section>`;

function showDecode() {
  const r = decode($('#code').value);
  $('#decode').innerHTML = r ? `<div class="final">ใช้กับ ${esc(r.proc)}</div>${r.rows.map(([k, t]) => `<div class="decode-row"><code>${esc(k)}</code><span>${esc(t)}</span></div>`).join('')}` : '<p class="feedback bad">ยังอ่านรหัสนี้ไม่ได้ ลองรูปแบบ E6013, ER70S-6 หรือ E71T-1</p>';
}
app.addEventListener('click', (e) => {
  const ty = e.target.closest('[data-ty]'), si = e.target.closest('[data-si]');
  if (ty && !('ty' in cur.got)) { cur.got.ty = ty.dataset.ty === cur.type; $$('[data-ty]').forEach((b) => { b.disabled = true; if (b.dataset.ty === cur.type) b.classList.add('is-right'); else if (b === ty) b.classList.add('is-wrong'); }); checkDone(); }
  if (si && !('si' in cur.got)) { cur.got.si = si.dataset.si === cur.side; $$('[data-si]').forEach((b) => { b.disabled = true; if (b.dataset.si === cur.side) b.classList.add('is-right'); else if (b === si) b.classList.add('is-wrong'); }); checkDone(); }
  if (e.target.closest('#drill-next')) newSymbol();
  const c = e.target.closest('[data-code]');
  if (c) { $('#code').value = c.dataset.code; showDecode(); }
});
$('#code').addEventListener('input', showDecode);
newSymbol();
showDecode();
