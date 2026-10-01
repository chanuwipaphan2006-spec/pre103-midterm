// การ์ดบอกชื่อกระบวนการ (พลิกแล้วบันทึกว่าดูแล้ว)
import { $, esc, pageData, shuffle } from './lib.js';
import * as seen from './seen.js';

const { flash } = pageData();
const cards = flash.map((c, i) => ({ ...c, key: `F:${i}` }));
const app = $('#flash-app');
let topic = 'all', onlyNew = false, deck = [], i = 0;

function build() {
  deck = shuffle(cards.filter((c) => (topic === 'all' || c.topic === topic) && (!onlyNew || !seen.get(c.key))));
  i = 0;
  render();
}
function counts() {
  const pool = cards.filter((c) => topic === 'all' || c.topic === topic);
  return [pool.filter((c) => seen.get(c.key)).length, pool.length];
}
function render() {
  const [n, total] = counts();
  const head = `<div class="filters"><div class="seg" role="group" aria-label="หมวด">${[['all', 'ทั้งหมด'], ['sheet-metal', 'Sheet Metal'], ['welding', 'Welding']].map(([k, l]) => `<button class="seg-btn ${topic === k ? 'is-on' : ''}" data-topic="${k}">${l}</button>`).join('')}</div>
    <button class="seg-btn ${onlyNew ? 'is-on' : ''}" data-new style="border:1px solid var(--line)">${onlyNew ? '✓ ' : ''}เฉพาะใบที่ยังไม่ได้ดู</button>
    <span class="chip" style="margin-left:auto"><i class="dot ${n ? 'live' : 'off'}"></i>ดูแล้ว ${n}/${total}</span></div>`;
  if (!deck.length) { app.innerHTML = `${head}<div class="quiz-card score"><p class="big">${n}/${total}</p><p>ดูครบทุกใบในหมวดนี้แล้ว</p><button class="btn btn-primary" data-reset-new>เปิดดูทั้งหมดอีกรอบ</button></div>`; return; }
  const c = deck[i];
  const item = seen.get(c.key);
  app.innerHTML = `${head}
  <div class="flash"><button class="flash-card" type="button" aria-label="แตะเพื่อพลิกการ์ด">
    <div class="flash-face"><div class="flash-top"><span class="chip ${c.topic === 'welding' ? 'chip-arc' : 'chip-steel'}">${c.topic === 'welding' ? 'Welding' : 'Sheet Metal'} · ใบที่ ${i + 1}/${deck.length}</span>${item ? `<span class="seen" style="cursor:default"><i class="dot live"></i>ดูแล้ว <time>${seen.when(item.last)}</time></span>` : ''}</div>${c.figHtml || ''}<div class="flash-q">${esc(c.q)}</div>${c.hint ? `<div class="flash-hint">คำใบ้: ${esc(c.hint)}</div>` : ''}<div class="flash-hint">นึกคำตอบในใจ แล้วแตะเพื่อดูเฉลย</div></div>
    <div class="flash-face flash-back"><div class="flash-hint">${esc(c.q)}</div><div class="ans">${esc(c.a)}</div></div>
  </button></div>
  <div class="flash-nav"><button class="btn" data-go="-1" ${i === 0 ? 'disabled' : ''}>ก่อนหน้า</button><button class="btn btn-ghost" data-shuffle>สับการ์ดใหม่</button><button class="btn btn-primary" data-go="1">${i + 1 < deck.length ? 'ถัดไป' : 'เริ่มรอบใหม่'}</button></div>`;
}
app.addEventListener('click', (e) => {
  const card = e.target.closest('.flash-card');
  if (card) {
    card.classList.toggle('is-flipped');
    if (card.classList.contains('is-flipped')) {
      const c = deck[i];
      seen.mark(c.key, { title: c.q.length > 60 ? c.q.slice(0, 58) + '…' : c.q, href: 'flashcards.html', kind: 'การ์ดบอกชื่อกระบวนการ' });
      const [n, total] = counts();
      const chip = $('.filters .chip', app);
      if (chip) chip.innerHTML = `<i class="dot live"></i>ดูแล้ว ${n}/${total}`;
    }
    return;
  }
  const t = e.target.closest('[data-topic]');
  if (t) { topic = t.dataset.topic; return build(); }
  if (e.target.closest('[data-new]')) { onlyNew = !onlyNew; return build(); }
  if (e.target.closest('[data-reset-new]')) { onlyNew = false; return build(); }
  if (e.target.closest('[data-shuffle]')) return build();
  const g = e.target.closest('[data-go]');
  if (g) { i += +g.dataset.go; if (i >= deck.length) return build(); render(); }
});
addEventListener('keydown', (e) => {
  if (document.querySelector('dialog[open]')) return;
  if (e.key === 'ArrowRight') $('[data-go="1"]')?.click();
  if (e.key === 'ArrowLeft') $('[data-go="-1"]')?.click();
});
build();
