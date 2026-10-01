// การ์ดบอกชื่อกระบวนการ
import { $, esc, pageData, shuffle } from './lib.js';

const { flash } = pageData();
const app = $('#flash-app');
let topic = 'all', deck = [], i = 0;

function build() { deck = shuffle(flash.filter((c) => topic === 'all' || c.topic === topic)); i = 0; render(); }
function render() {
  const c = deck[i];
  app.innerHTML = `<div class="filters"><div class="seg" role="group" aria-label="หมวด">${[['all', 'ทั้งหมด'], ['sheet-metal', 'Sheet Metal'], ['welding', 'Welding']].map(([k, l]) => `<button class="seg-btn ${topic === k ? 'is-on' : ''}" data-topic="${k}">${l}</button>`).join('')}</div><span class="chip">${i + 1} / ${deck.length}</span></div>
  <div class="flash"><button class="flash-card" type="button" aria-label="แตะเพื่อพลิกการ์ด">
    <div class="flash-face"><span class="chip ${c.topic === 'welding' ? 'chip-arc' : 'chip-steel'}">${c.topic === 'welding' ? 'Welding' : 'Sheet Metal'}</span>${c.figHtml || ''}<div class="flash-q">${esc(c.q)}</div>${c.hint ? `<div class="flash-hint">คำใบ้: ${esc(c.hint)}</div>` : ''}<div class="flash-hint">แตะเพื่อดูเฉลย</div></div>
    <div class="flash-face flash-back"><div class="flash-hint">${esc(c.q)}</div><div class="ans">${esc(c.a)}</div></div>
  </button></div>
  <div class="flash-nav"><button class="btn" data-go="-1" ${i === 0 ? 'disabled' : ''}>ก่อนหน้า</button><button class="btn btn-ghost" data-shuffle>สับการ์ดใหม่</button><button class="btn btn-primary" data-go="1">${i + 1 < deck.length ? 'ถัดไป' : 'เริ่มรอบใหม่'}</button></div>`;
}
app.addEventListener('click', (e) => {
  const card = e.target.closest('.flash-card');
  if (card) { card.classList.toggle('is-flipped'); return; }
  const t = e.target.closest('[data-topic]');
  if (t) { topic = t.dataset.topic; return build(); }
  if (e.target.closest('[data-shuffle]')) return build();
  const g = e.target.closest('[data-go]');
  if (g) { i += +g.dataset.go; if (i >= deck.length) return build(); render(); }
});
addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') $('[data-go="1"]')?.click();
  if (e.key === 'ArrowLeft') $('[data-go="-1"]')?.click();
  if (e.key === ' ' && document.activeElement?.classList.contains('flash-card') === false && !/input|select/i.test(document.activeElement?.tagName)) { e.preventDefault(); $('.flash-card')?.click(); }
});
build();
