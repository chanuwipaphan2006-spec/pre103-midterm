// ส่วนที่ทุกหน้าใช้: หน้าโหลด ธีม เมนู นาฬิกา ค้นหา ทัวร์ แอนิเมชัน และระบบ "ดูแล้ว"
import * as seen from './seen.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const TOTALS = window.__TOTALS || {};
const PAGE = document.body.dataset.page;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const escH = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- toast ----------
const toastEl = $('.toast');
let toastT;
export function toast(msg) {
  if (!toastEl) return;
  toastEl.innerHTML = msg;
  toastEl.classList.add('is-on');
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
}
window.__toast = toast;

// ---------- หน้าโหลดพร้อมคำคม (ครั้งแรกของแต่ละ session) ----------
let loaderDone = Promise.resolve();
(() => {
  const el = $('#loader');
  if (!el) return;
  let shown = false;
  try { shown = sessionStorage.getItem('pre103-loaded') === '1'; sessionStorage.setItem('pre103-loaded', '1'); } catch {}
  if (shown) { el.remove(); return; }
  const Q = window.__QUOTES || [['', '']];
  const q = Q[Math.floor(Math.random() * Q.length)];
  $('.loader-quote', el).textContent = q[0];
  $('.loader-by', el).textContent = q[1] ? `· ${q[1]}` : '';
  loaderDone = new Promise((res) => {
    const t0 = performance.now();
    const done = () => { el.classList.add('is-done'); setTimeout(() => { el.remove(); res(); }, 450); };
    const finish = () => setTimeout(done, Math.max(0, 1100 - (performance.now() - t0)));
    if (document.readyState === 'complete') finish(); else addEventListener('load', finish, { once: true });
    setTimeout(done, 3000);
  });
})();

// ---------- ธีม ----------
const themeBtn = $('[data-theme-toggle]');
const currentTheme = () => document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
function paintThemeIcon() {
  if (!themeBtn) return;
  const dark = currentTheme() === 'dark';
  $('use', themeBtn).setAttribute('href', dark ? '#i-sun' : '#i-moon');
  themeBtn.setAttribute('aria-label', dark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด');
}
themeBtn?.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('pre103-theme', next); } catch {}
  paintThemeIcon();
});
paintThemeIcon();

// ---------- เมนู ----------
const menuBtn = $('.menu-btn');
const setNav = (open) => { document.body.classList.toggle('nav-open', open); menuBtn?.setAttribute('aria-expanded', String(open)); };
menuBtn?.addEventListener('click', () => setNav(!document.body.classList.contains('nav-open')));
$('[data-open-nav]')?.addEventListener('click', (e) => { e.preventDefault(); setNav(true); });
$('[data-close-nav]')?.addEventListener('click', () => setNav(false));
$$('.sidenav a').forEach((a) => a.addEventListener('click', () => setNav(false)));

// ---------- นาฬิกา + เวลาที่ใช้เรียน ----------
const TH_DAY = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const clockEl = $('[data-clock]'), dateEl = $('[data-clock-date]');
function tick() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  if (clockEl) clockEl.textContent = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  if (dateEl) dateEl.textContent = `วัน${TH_DAY[d.getDay()]} ${d.getDate()} ${TH_MON[d.getMonth()]} ${d.getFullYear() + 543}`;
}
tick();
setInterval(tick, 1000);
let lastActive = Date.now();
['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach((ev) => addEventListener(ev, () => { lastActive = Date.now(); }, { passive: true }));
setInterval(() => {
  if (!document.hidden && Date.now() - lastActive < 90000) {
    seen.addStudySeconds(15);
    const el = $('[data-today-time]');
    if (el) el.textContent = seen.minutesText(seen.studyTime()[seen.todayKey()] || 0);
  }
}, 15000);

// ---------- ค้นหา ----------
const dlg = $('#search-dlg'), input = $('#search-input'), results = $('#search-results');
let index = null;
async function ensureIndex() { if (index) return index; try { index = await (await fetch('search.json')).json(); } catch { index = []; } return index; }
function openSearch() { if (!dlg) return; dlg.showModal(); input.value = ''; results.innerHTML = '<li class="search-empty">พิมพ์อย่างน้อย 2 ตัวอักษร ไทยหรืออังกฤษก็ได้</li>'; input.focus(); ensureIndex(); }
$$('[data-open-search]').forEach((b) => b.addEventListener('click', openSearch));
addEventListener('keydown', (e) => {
  if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement?.tagName || '') && !document.querySelector('dialog[open]')) { e.preventDefault(); openSearch(); }
  if (e.key === 'Escape') setNav(false);
});
input?.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); dlg.close(); } });
input?.addEventListener('input', async () => {
  const q = input.value.trim().toLowerCase();
  if (q.length < 2) { results.innerHTML = '<li class="search-empty">พิมพ์อย่างน้อย 2 ตัวอักษร</li>'; return; }
  const words = q.split(/\s+/);
  const hits = (await ensureIndex()).map((s) => {
    const hay = (s.title + ' ' + s.text).toLowerCase();
    if (!words.every((w) => hay.includes(w))) return null;
    return { s, score: words.reduce((a, w) => a + (s.title.toLowerCase().includes(w) ? 5 : 0) + hay.split(w).length, 0) };
  }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 20);
  if (!hits.length) { results.innerHTML = '<li class="search-empty">ไม่พบ ลองคำอื่น เช่น ภาษาอังกฤษหรือตัวย่อ</li>'; return; }
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  results.innerHTML = hits.map(({ s }) => {
    const i = s.text.toLowerCase().indexOf(words[0]);
    const snip = s.text.slice(Math.max(0, i - 60), i + 120);
    const sk = seen.get(`L:${s.lesson_id}:${s.id}`);
    return `<li><a href="${s.page}#${s.id}"><div class="sr-meta">${escH(s.lesson)}${sk ? ' · <span style="color:var(--seen)">ดูแล้ว</span>' : ''}</div><div class="sr-title">${escH(s.title).replace(re, '<mark>$1</mark>')}</div><div class="sr-snip">…${escH(snip).replace(re, '<mark>$1</mark>')}…</div></a></li>`;
  }).join('');
});
results?.addEventListener('click', (e) => { if (e.target.closest('a')) dlg.close(); });

// ---------- ขยายรูป ----------
const lb = $('#lightbox');
document.addEventListener('click', (e) => {
  const z = e.target.closest('.fig-zoom');
  if (z && !z.closest('.flash-card')) {
    const img = $('img', z);
    $('img', lb).src = img.currentSrc || img.src;
    $('img', lb).alt = img.alt;
    lb.hidden = false;
    $('.lb-close', lb).focus();
  }
});
lb?.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('.lb-close')) lb.hidden = true; });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && lb && !lb.hidden) lb.hidden = true; });

// ---------- ปุ่มคัดลอก ----------
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-copy]');
  if (!b) return;
  try { await navigator.clipboard.writeText(b.dataset.copy); toast('คัดลอกอีเมลแล้ว'); }
  catch { const r = document.createRange(); const t = b.previousElementSibling; if (t) { r.selectNodeContents(t); getSelection().removeAllRanges(); getSelection().addRange(r); } toast('เลือกข้อความไว้แล้ว กด Ctrl+C เพื่อคัดลอก'); }
});

// ---------- กลับขึ้นบน + แถบความคืบหน้าการอ่าน ----------
const top = $('.to-top'), rp = $('.read-progress');
const onScroll = () => {
  top?.classList.toggle('is-on', scrollY > 900);
  if (rp) { const h = document.documentElement.scrollHeight - innerHeight; rp.style.setProperty('--p', h > 0 ? Math.min(1, scrollY / h).toFixed(4) : 0); }
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();
top?.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

// ---------- แอนิเมชันตอนเลื่อนถึง ----------
if (!reduced && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.prose .fig, .prose .box, .prose .math-block, .prose .table-wrap, .gallery, .fcard').forEach((el) => { el.classList.add('reveal'); io.observe(el); });
}
$$('.stagger').forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty('--i', i)));

// ---------- ทัวร์แนะนำการใช้งาน ----------
const TOUR = [
  ['i-sheet', 'ยินดีต้อนรับ', 'เว็บนี้รวมเนื้อหากลางภาค PRE103 สองบท คือ Sheet Metal Forming และ Welding พร้อมข้อสอบเก่าและเครื่องมือฝึก ใช้ได้ทั้งมือถือและคอม'],
  ['i-book', 'อ่านบทเรียนตามลำดับ', 'เลือกบทจากเมนูซ้าย (มือถือกด "เมนู" ด้านล่าง) สารบัญด้านขวาพาไปหัวข้อที่ต้องการ กด / หรือปุ่มค้นหาเพื่อหาคำ เช่น clearance หรือ E6013'],
  ['i-eye', 'ระบบบันทึกว่าดูแล้ว', 'อ่านหัวข้อไหนค้างไว้ราว 3 วินาที ระบบจะติดป้าย "ดูแล้ว" สีเขียวพร้อมเวลาให้เอง ข้อสอบที่เปิดดูเฉลยก็ถูกบันทึกเหมือนกัน หน้าแรกจะสรุปว่าอ่านไปกี่เปอร์เซ็นต์และพาไปต่อจากจุดที่ค้าง'],
  ['i-target', 'ฝึกให้พร้อมสอบ', 'ข้อสอบเก่าเลือกได้ว่าจะดูเฉลยทันทีหรือทำทีละขั้น เครื่องคำนวณแสดงการแทนค่าทุกขั้น แบบทดสอบสุ่มตัวเลขใหม่ทุกครั้ง การ์ดช่วยจำชื่อกระบวนการ'],
  ['i-help', 'สีของกล่องในบทเรียน', 'ฟ้า = เทคนิคจำ · เหลือง = ระวัง ต้นฉบับหรือเฉลยมีจุดผิด · ม่วง = ออกสอบ · เขียวน้ำทะเล = ควรรู้เพิ่ม · กรอบประ = ลิงก์อ่านเพิ่มจากเว็บ ดูวิธีใช้ทั้งหมดได้ที่หน้า "วิธีใช้เว็บ"'],
];
const tour = $('#tour');
let ti = 0;
function paintTour() {
  const [ic, h, p] = TOUR[ti];
  $('.tour-art', tour).innerHTML = `<svg class="ic"><use href="#${ic}"/></svg>`;
  $('#tour-title').textContent = h;
  $('.tour-body p', tour).textContent = p;
  $('.tour-dots', tour).innerHTML = TOUR.map((_, i) => `<i class="${i === ti ? 'on' : ''}"></i>`).join('');
  $('[data-tour="prev"]', tour).disabled = ti === 0;
  $('[data-tour="next"]', tour).textContent = ti === TOUR.length - 1 ? 'เริ่มใช้งาน' : 'ถัดไป';
}
function openTour() { if (!tour) return; ti = 0; paintTour(); tour.showModal(); }
function closeTour() { tour.close(); try { localStorage.setItem('pre103-tour', '1'); } catch {} }
tour?.addEventListener('click', (e) => {
  const b = e.target.closest('[data-tour]');
  if (!b) return;
  if (b.dataset.tour === 'skip') return closeTour();
  if (b.dataset.tour === 'prev' && ti > 0) ti--;
  if (b.dataset.tour === 'next') { if (ti === TOUR.length - 1) return closeTour(); ti++; }
  paintTour();
});
tour?.addEventListener('cancel', () => { try { localStorage.setItem('pre103-tour', '1'); } catch {} });
$$('[data-open-tour]').forEach((b) => b.addEventListener('click', openTour));
loaderDone.then(() => {
  let done = false;
  try { done = localStorage.getItem('pre103-tour') === '1'; } catch { done = true; }
  if (!done && !navigator.webdriver) setTimeout(openTour, 400);
});

// ---------- ระบบ "ดูแล้ว" ในบทเรียน ----------
let suppressId = null; // หัวข้อที่ผู้ใช้เพิ่งยกเลิก จะไม่ถูกบันทึกซ้ำจนกว่าจะเลื่อนออกไป
const lesson = $('article.lesson');
const lessonId = lesson?.dataset.lesson;
const kOf = (h) => `L:${lessonId}:${h.id}`;
function headingText(h) { return [...h.childNodes].filter((n) => !(n.nodeType === 1 && (n.classList.contains('anchor') || n.classList.contains('seen')))).map((n) => n.textContent).join('').trim(); }
function paintHeading(h) {
  h.querySelector('.seen')?.remove();
  const item = seen.get(kOf(h));
  if (item) h.insertAdjacentHTML('beforeend', seen.badge(kOf(h), item));
  const a = $(`.toc a[href="#${h.id}"] .dot`);
  if (a) a.classList.toggle('off', !item), a.classList.toggle('live', !!item);
}
function paintLessonProgress() {
  if (!lesson) return;
  const heads = $$('h2[id], h3[id]', lesson);
  const n = heads.filter((h) => seen.get(kOf(h))).length;
  const pct = heads.length ? Math.round((n / heads.length) * 100) : 0;
  $$('[data-lesson-progress]').forEach((el) => { el.textContent = `ดูแล้ว ${n}/${heads.length} หัวข้อ (${pct}%)`; });
  $$('.toc .bar > i, .lesson-hero .bar > i').forEach((el) => el.style.setProperty('--w', pct + '%'));
  const tc = $('.toc-count'); if (tc) tc.textContent = `${n}/${heads.length}`;
  const btn = $('[data-mark-all]');
  if (btn) btn.innerHTML = n === heads.length ? '<i class="dot live"></i> อ่านครบทุกหัวข้อแล้ว' : 'ทำเครื่องหมายว่าอ่านครบทั้งบท';
}
if (lesson) {
  const heads = $$('h2[id], h3[id]', lesson);
  $$('.toc a').forEach((a) => a.insertAdjacentHTML('afterbegin', '<i class="dot off" aria-hidden="true"></i>'));
  heads.forEach(paintHeading);
  paintLessonProgress();
  const short = document.title.split(' · ')[0];
  const markHead = (h) => {
    if (seen.get(kOf(h))) return;
    seen.mark(kOf(h), { title: headingText(h), href: `${PAGE}#${h.id}`, kind: short });
    paintHeading(h); paintLessonProgress();
  };
  // หัวข้อปัจจุบัน = หัวข้อสุดท้ายที่เลื่อนผ่านเส้น 35% ของจอ อยู่ครบ 2.5 วินาทีถือว่าดูแล้ว
  let current = null, since = 0;
  const pick = () => {
    const line = innerHeight * 0.35;
    let cur = null;
    for (const h of heads) { if (h.getBoundingClientRect().top <= line) cur = h; else break; }
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 40) cur = heads[heads.length - 1];
    return cur;
  };
  setInterval(() => {
    if (document.hidden) return;
    const c = pick();
    if (c !== current) { current = c; since = Date.now(); if (c?.id !== suppressId) suppressId = null; return; }
    if (c && c.id !== suppressId && Date.now() - since >= 2500) markHead(c);
  }, 400);
  // สารบัญ: ไฮไลต์หัวข้อที่กำลังอ่าน
  const links = new Map($$('.toc a').map((a) => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { links.forEach((a) => a.classList.remove('is-active')); links.get(en.target.id)?.classList.add('is-active'); } }), { rootMargin: '0px 0px -70% 0px' });
  heads.forEach((h) => io.observe(h));
  $('[data-mark-all]')?.addEventListener('click', () => {
    const allSeen = heads.every((h) => seen.get(kOf(h)));
    if (allSeen) { toast('อ่านครบทุกหัวข้อแล้ว'); return; }
    heads.forEach((h) => { if (!seen.get(kOf(h))) seen.mark(kOf(h), { title: headingText(h), href: `${PAGE}#${h.id}`, kind: short }); paintHeading(h); });
    paintLessonProgress();
    toast('<i class="dot live"></i> บันทึกว่าอ่านครบทั้งบทแล้ว');
  });
}
// แตะป้าย "ดูแล้ว" เพื่อยกเลิก
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-unseen]');
  if (!b) return;
  e.preventDefault();
  const key = b.dataset.unseen;
  seen.unmark(key);
  const h = b.closest('h2, h3');
  b.remove();
  if (h) { suppressId = h.id; const a =$(`.toc a[href="#${h.id}"] .dot`); a?.classList.add('off'); a?.classList.remove('live'); paintLessonProgress(); }
  toast('ยกเลิกเครื่องหมาย "ดูแล้ว" แล้ว');
});

// ---------- หน้าเครื่องมือ: บันทึกการเข้าดู ----------
const TOOL_PAGES = { 'prep.html': 'เตรียมสอบ: ต้องเน้นอะไร', 'formulas.html': 'สูตรที่ต้องจำ', 'calculators.html': 'เครื่องคำนวณ', 'quiz.html': 'แบบทดสอบ', 'flashcards.html': 'บอกชื่อกระบวนการ', 'aws.html': 'สัญลักษณ์ AWS', 'downloads.html': 'ดาวน์โหลด PDF', 'guide.html': 'วิธีใช้เว็บ', 'exams.html': 'ข้อสอบเก่า' };
if (TOOL_PAGES[PAGE]) setTimeout(() => seen.mark(`P:${PAGE}`, { title: TOOL_PAGES[PAGE], href: PAGE, kind: 'หน้า' }), 3000);

// ---------- ความคืบหน้าในเมนู ----------
function paintNav() {
  const all = seen.all();
  const keys = Object.keys(all);
  $$('.sidenav a[data-track]').forEach((a) => {
    const t = a.dataset.track, el = $('.nav-prog', a);
    let n = 0, total = 0;
    if (t.startsWith('L:')) { n = keys.filter((k) => k.startsWith(t + ':')).length; total = TOTALS[t.slice(2)] || 0; }
    if (t === 'Q') { n = keys.filter((k) => k.startsWith('Q:')).length; total = TOTALS.Q || 0; }
    if (t === 'F') { n = keys.filter((k) => k.startsWith('F:')).length; total = TOTALS.F || 0; }
    if (t === 'C') { n = keys.filter((k) => k.startsWith('C:')).length; total = TOTALS.C || 0; }
    if (!total || !n) { el.innerHTML = ''; return; }
    const pct = Math.min(100, Math.round((n / total) * 100));
    el.innerHTML = `<i class="dot ${pct >= 100 ? 'live' : ''}"></i>${pct}%`;
    a.title = `ดูแล้ว ${n} จาก ${total}`;
  });
}
paintNav();
addEventListener('seen:change', paintNav);

// ---------- หน้าแรก ----------
if (document.body.classList.contains('is-home')) {
  const all = seen.all();
  const entries = Object.entries(all).filter(([, v]) => v.href).sort((a, b) => b[1].last - a[1].last);
  // เรียนต่อจากที่ค้าง
  const lastLesson = entries.find(([k]) => k.startsWith('L:'));
  const res = $('[data-resume]');
  if (res && lastLesson) {
    const [, v] = lastLesson;
    res.hidden = false;
    $('[data-resume-title]', res).textContent = v.title;
    $('[data-resume-meta]', res).innerHTML = `<i class="dot live"></i>${escH(v.kind)} · ดูล่าสุด ${seen.when(v.last)}`;
    $('[data-resume-link]', res).href = v.href;
  }
  // วงแหวนความคืบหน้า
  const ring = (sel, n, total) => {
    const el = $(sel); if (!el) return;
    const pct = total ? Math.round((n / total) * 100) : 0;
    const r = $('.ring', el);
    r.dataset.label = pct + '%';
    requestAnimationFrame(() => requestAnimationFrame(() => r.style.setProperty('--v', pct)));
    $('span', el.querySelector('div:last-child')).textContent = `ดูแล้ว ${n} จาก ${total}`;
  };
  const keys = Object.keys(all);
  ring('[data-ring="sheet-metal"]', keys.filter((k) => k.startsWith('L:sheet-metal:')).length, TOTALS['sheet-metal'] || 0);
  ring('[data-ring="welding"]', keys.filter((k) => k.startsWith('L:welding:')).length, TOTALS.welding || 0);
  ring('[data-ring="Q"]', keys.filter((k) => k.startsWith('Q:')).length, TOTALS.Q || 0);
  $$('[data-lesson-card]').forEach((c) => {
    const id = c.dataset.lessonCard, n = keys.filter((k) => k.startsWith(`L:${id}:`)).length, total = TOTALS[id] || 0;
    const pct = total ? Math.round((n / total) * 100) : 0;
    requestAnimationFrame(() => requestAnimationFrame(() => $('.bar > i', c)?.style.setProperty('--w', pct + '%')));
    const m = $('[data-card-prog]', c);
    if (m) m.innerHTML = n ? `<i class="dot ${pct >= 100 ? 'live' : ''}"></i>ดูแล้ว ${pct}%` : 'ยังไม่ได้เริ่ม';
  });
  // ประวัติล่าสุด
  const hist = $('[data-history]');
  if (hist) {
    hist.innerHTML = entries.length
      ? entries.slice(0, 8).map(([, v]) => `<li><a href="${escH(v.href)}"><i class="dot live" aria-hidden="true"></i><span class="h-body"><span class="h-title">${escH(v.title)}</span><span class="h-kind">${escH(v.kind)}</span></span><time datetime="${new Date(v.last).toISOString()}">${seen.when(v.last)}</time></a></li>`).join('')
      : '<li class="empty">ยังไม่มีประวัติ เริ่มอ่านบทที่ 1 แล้วหัวข้อที่อ่านจะขึ้นที่นี่พร้อมเวลา</li>';
  }
  const tt = $('[data-today-time]');
  if (tt) tt.textContent = seen.minutesText(seen.studyTime()[seen.todayKey()] || 0);
  const qb = $('[data-quiz-best]');
  if (qb) { try { const b = JSON.parse(localStorage.getItem('pre103-progress') || '{}').quizBest; qb.textContent = b ? `${b.score}/${b.total}` : 'ยังไม่ได้ทำ'; } catch {} }
}

// ---------- หน้าวิธีใช้: ล้างประวัติ ----------
let resetArmed = false;
$('[data-reset]')?.addEventListener('click', (e) => {
  const b = e.currentTarget;
  if (!resetArmed) { resetArmed = true; b.textContent = 'แตะอีกครั้งเพื่อยืนยันการล้าง'; setTimeout(() => { resetArmed = false; b.textContent = 'ล้างประวัติทั้งหมด'; }, 4000); return; }
  seen.clearAll();
  resetArmed = false;
  b.textContent = 'ล้างประวัติทั้งหมด';
  toast('ล้างประวัติและความคืบหน้าแล้ว');
});

// ---------- หน้าสูตร: โหมดทบทวน ----------
$$('[data-fmode]').forEach((b) => b.addEventListener('click', () => {
  $$('[data-fmode]').forEach((x) => x.classList.toggle('is-on', x === b));
  document.body.classList.toggle('f-quiz', b.dataset.fmode === 'quiz');
  $$('.fcard').forEach((c) => c.classList.remove('is-open'));
}));
document.addEventListener('click', (e) => { const r = e.target.closest('.fcard-reveal'); if (r) r.closest('.fcard').classList.add('is-open'); });

// ---------- เช็กลิสต์เตรียมสอบ (หน้าเตรียมสอบ) ----------
const checks = $$('input[data-check]');
function paintChecks() {
  const n = checks.filter((c) => c.checked).length;
  $$('[data-check-progress]').forEach((el) => { el.textContent = `ทำได้แล้ว ${n}/${checks.length} ข้อ`; });
  $$('[data-check-bar]').forEach((el) => el.style.setProperty('--w', `${checks.length ? Math.round((n / checks.length) * 100) : 0}%`));
}
function paintCheck(cb) {
  const li = cb.closest('li');
  $('.seen', li)?.remove();
  const item = seen.get(cb.dataset.check);
  cb.checked = !!item;
  li.classList.toggle('is-done', !!item);
  if (item) $('label', li).insertAdjacentHTML('afterend', `<span class="seen" style="cursor:default" title="ติ๊กเมื่อ ${seen.fullTime(item.last)}"><i class="dot live" aria-hidden="true"></i>ทำได้แล้ว <time>${seen.when(item.last)}</time></span>`);
}
checks.forEach((cb) => {
  paintCheck(cb);
  cb.addEventListener('change', () => {
    const title = $('b', cb.closest('label'))?.textContent || 'เช็กลิสต์';
    if (cb.checked) { seen.mark(cb.dataset.check, { title: `เช็กลิสต์: ${title}`, href: 'prep.html#checklist', kind: 'เตรียมสอบ' }); toast('<i class="dot live"></i> บันทึกแล้ว'); }
    else seen.unmark(cb.dataset.check);
    paintCheck(cb); paintChecks();
  });
});
if (checks.length) paintChecks();

// ---------- ยอดผู้เข้าชม/ดาวน์โหลด (เก็บในชีตเดียวกับ EEE270 แยกตัวนับ) ----------
const API = 'https://script.google.com/macros/s/AKfycbwefV3ifZTWF8Ixre0l_QNAD_a49d5nsD5Kdyw0_-yCRLz-oaCGdb-45dpeWYd7RSnyGQ/exec';
// ส่งเฉพาะบนเว็บจริง ไม่ส่งตอนทดสอบอัตโนมัติ ในเครื่อง หรือในหน้าตัวอย่าง
const LIVE = location.hostname.endsWith('github.io') && !navigator.webdriver;
function track(type, extra = {}) {
  if (!LIVE) return;
  const body = JSON.stringify({ action: 'track', site: 'pre103', type, page: PAGE, ...extra });
  try { if (!navigator.sendBeacon || !navigator.sendBeacon(API, new Blob([body], { type: 'text/plain' }))) fetch(API, { method: 'POST', body, keepalive: true, mode: 'no-cors' }); } catch {}
}
try {
  if (!sessionStorage.getItem('pre103-visit')) {
    sessionStorage.setItem('pre103-visit', '1');
    let first = false;
    try { first = !localStorage.getItem('pre103-visitor'); localStorage.setItem('pre103-visitor', '1'); } catch {}
    track('visit', { first });
  }
} catch {}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="pdf/"]');
  if (a) track('download', { file: a.getAttribute('href').slice(4) });
});
const nf = (n) => Number(n || 0).toLocaleString('th-TH');
function countUp(el, to) {
  if (reduced || !to) { el.textContent = nf(to); return; }
  const t0 = performance.now(), d = 900;
  const step = (t) => { const p = Math.min(1, (t - t0) / d); el.textContent = nf(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
async function loadStats() {
  const targets = $$('[data-stat]');
  if (!targets.length) return;
  let s = null;
  try { const c = JSON.parse(sessionStorage.getItem('pre103-stats') || 'null'); if (c && Date.now() - c.at < 60000) s = c.s; } catch {}
  if (!s) {
    try {
      const ctl = new AbortController(); setTimeout(() => ctl.abort(), 8000);
      s = await (await fetch(`${API}?action=stats&site=pre103`, { signal: ctl.signal })).json();
      if (s && s.ok) sessionStorage.setItem('pre103-stats', JSON.stringify({ at: Date.now(), s }));
    } catch { s = null; }
  }
  if (!s || !s.ok) { $$('[data-stats-wrap]').forEach((w) => { w.hidden = true; }); return; }
  $$('[data-stats-wrap]').forEach((w) => { w.hidden = false; });
  targets.forEach((el) => countUp(el, s[el.dataset.stat]));
  $$('[data-stat-updated]').forEach((el) => { el.textContent = seen.when(s.updated); });
}
if ('requestIdleCallback' in window) requestIdleCallback(loadStats, { timeout: 2500 }); else setTimeout(loadStats, 800);

// ---------- ภาพเคลื่อนไหวหน้าแรก: หยุดถ้าผู้ใช้ตั้งค่าลดการเคลื่อนไหว ----------
if (reduced) $$('svg.hero-art').forEach((s) => { try { s.pauseAnimations(); s.setCurrentTime(2.6); } catch {} });
