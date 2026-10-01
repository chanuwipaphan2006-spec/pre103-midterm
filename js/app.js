// ส่วนที่ทุกหน้าใช้: ธีม เมนู ค้นหา ขยายรูป ความคืบหน้า หน้าโหลด
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const KEY = 'pre103-progress';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const save = (patch) => { try { localStorage.setItem(KEY, JSON.stringify({ ...load(), ...patch })); } catch {} };

// ---------- หน้าโหลดพร้อมคำคม (แสดงครั้งแรกของแต่ละ session เท่านั้น) ----------
(() => {
  const el = $('#loader');
  if (!el) return;
  let seen = false;
  try { seen = sessionStorage.getItem('pre103-loaded') === '1'; sessionStorage.setItem('pre103-loaded', '1'); } catch {}
  if (seen) { el.remove(); return; }
  const q = (window.__QUOTES || [])[Math.floor(Math.random() * (window.__QUOTES || [1]).length)] || ['', ''];
  $('.loader-quote', el).textContent = q[0];
  $('.loader-by', el).textContent = q[1] ? `· ${q[1]}` : '';
  const done = () => { el.classList.add('is-done'); setTimeout(() => el.remove(), 400); };
  const t0 = performance.now();
  const finish = () => setTimeout(done, Math.max(0, 900 - (performance.now() - t0)));
  if (document.readyState === 'complete') finish(); else addEventListener('load', finish, { once: true });
  setTimeout(done, 2500); // กันค้าง
})();

// ---------- ธีม ----------
const themeBtn = $('[data-theme-toggle]');
function currentTheme() {
  const t = document.documentElement.dataset.theme;
  if (t) return t;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function paintThemeIcon() {
  if (!themeBtn) return;
  const dark = currentTheme() === 'dark';
  themeBtn.querySelector('use').setAttribute('href', dark ? '#i-sun' : '#i-moon');
  themeBtn.setAttribute('aria-label', dark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด');
}
themeBtn?.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('pre103-theme', next); } catch {}
  paintThemeIcon();
});
paintThemeIcon();

// ---------- เมนูมือถือ ----------
const menuBtn = $('.menu-btn');
const setNav = (open) => { document.body.classList.toggle('nav-open', open); menuBtn?.setAttribute('aria-expanded', String(open)); };
menuBtn?.addEventListener('click', () => setNav(!document.body.classList.contains('nav-open')));
$('[data-close-nav]')?.addEventListener('click', () => setNav(false));
addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false); });
$$('.sidenav a').forEach((a) => a.addEventListener('click', () => setNav(false)));

// ---------- ค้นหา ----------
const dlg = $('#search-dlg');
const input = $('#search-input');
const results = $('#search-results');
let index = null;
async function ensureIndex() {
  if (index) return index;
  try { index = await (await fetch('search.json')).json(); } catch { index = []; }
  return index;
}
function openSearch() { if (!dlg) return; dlg.showModal(); input.value = ''; results.innerHTML = '<li class="search-empty">พิมพ์อย่างน้อย 2 ตัวอักษร</li>'; input.focus(); ensureIndex(); }
$$('[data-open-search]').forEach((b) => b.addEventListener('click', openSearch));
addEventListener('keydown', (e) => {
  if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement?.tagName || '')) { e.preventDefault(); openSearch(); }
});
const escH = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
input?.addEventListener('input', async () => {
  const q = input.value.trim().toLowerCase();
  if (q.length < 2) { results.innerHTML = '<li class="search-empty">พิมพ์อย่างน้อย 2 ตัวอักษร</li>'; return; }
  const words = q.split(/\s+/);
  const idx = await ensureIndex();
  const hits = idx.map((s) => {
    const hay = (s.title + ' ' + s.text).toLowerCase();
    if (!words.every((w) => hay.includes(w))) return null;
    const score = words.reduce((a, w) => a + (s.title.toLowerCase().includes(w) ? 5 : 0) + hay.split(w).length, 0);
    return { s, score };
  }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 20);
  if (!hits.length) { results.innerHTML = '<li class="search-empty">ไม่พบ ลองคำอื่น เช่น ภาษาอังกฤษหรือตัวย่อ</li>'; return; }
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  results.innerHTML = hits.map(({ s }) => {
    const i = s.text.toLowerCase().indexOf(words[0]);
    const snip = s.text.slice(Math.max(0, i - 60), i + 120);
    return `<li><a href="${s.page}#${s.id}"><div class="sr-meta">${escH(s.lesson)}</div><div class="sr-title">${escH(s.title).replace(re, '<mark>$1</mark>')}</div><div class="sr-snip">…${escH(snip).replace(re, '<mark>$1</mark>')}…</div></a></li>`;
  }).join('');
});
results?.addEventListener('click', (e) => { if (e.target.closest('a')) dlg.close(); });
// Escape ปิดหน้าค้นหาทันที (ช่อง type=search ปกติจะแค่ลบข้อความ)
input?.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); dlg.close(); } });

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

// ---------- ปุ่มกลับขึ้นบน ----------
const top = $('.to-top');
addEventListener('scroll', () => top?.classList.toggle('is-on', scrollY > 900), { passive: true });
top?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

// ---------- สารบัญ + ความคืบหน้าบทเรียน ----------
const lesson = $('article.lesson');
if (lesson) {
  const id = lesson.dataset.lesson;
  const heads = $$('h2[id], h3[id]', lesson);
  const links = new Map($$('.toc a').map((a) => [a.getAttribute('href').slice(1), a]));
  const seen = new Set((load().sections || {})[id] || []);
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      links.forEach((a) => a.classList.remove('is-active'));
      links.get(en.target.id)?.classList.add('is-active');
      if (en.target.tagName === 'H2' && !seen.has(en.target.id)) {
        seen.add(en.target.id);
        const all = load().sections || {};
        save({ sections: { ...all, [id]: [...seen] } });
      }
    }
  }, { rootMargin: '0px 0px -70% 0px' });
  heads.forEach((h) => io.observe(h));
  const btn = $('[data-mark-read]');
  const paint = () => { const done = (load().read || []).includes(id); btn.textContent = done ? 'อ่านจบแล้ว ✓ (แตะเพื่อยกเลิก)' : 'อ่านบทนี้จบแล้ว'; };
  btn?.addEventListener('click', () => {
    const read = new Set(load().read || []);
    read.has(id) ? read.delete(id) : read.add(id);
    save({ read: [...read] });
    paint();
  });
  paint();
}

// ---------- หน้าแรก: แสดงความคืบหน้า ----------
$$('[data-progress-for]').forEach((el) => {
  const id = el.dataset.progressFor;
  const p = load();
  const card = el.closest('[data-lesson-card]');
  const total = card ? +(card.querySelector('.card-meta')?.textContent.match(/\d+/)?.[0] || 0) : 0;
  const got = ((p.sections || {})[id] || []).length;
  if ((p.read || []).includes(id)) el.innerHTML = '<span class="chip chip-ok">อ่านจบแล้ว</span>';
  else if (got) el.innerHTML = `<span class="chip chip-steel">อ่านแล้ว ${Math.min(got, total)}/${total} หัวข้อ</span>`;
});
const qs = $('[data-quiz-best]');
if (qs) { const b = load().quizBest; qs.textContent = b ? `${b.score}/${b.total}` : 'ยังไม่ได้ทำ'; }
const ex = $('[data-exam-done]');
if (ex) ex.textContent = String((load().examSeen || []).length);

// ---------- หน้าสูตร: โหมดทบทวน ----------
$$('[data-fmode]').forEach((b) => b.addEventListener('click', () => {
  $$('[data-fmode]').forEach((x) => x.classList.toggle('is-on', x === b));
  document.body.classList.toggle('f-quiz', b.dataset.fmode === 'quiz');
  $$('.fcard').forEach((c) => c.classList.remove('is-open'));
}));
document.addEventListener('click', (e) => { const r = e.target.closest('.fcard-reveal'); if (r) r.closest('.fcard').classList.add('is-open'); });
