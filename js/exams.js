// หน้าข้อสอบเก่า: ดูเฉลยทันที / ทำทีละขั้น
import { $, $$, esc, tex, pageData, store, stepsHtml, unitTex, checkNum, shuffle, fmtNum } from './lib.js';
import { PROBLEMS } from './engine/problems.js';
import { FORMULA_CHOICES } from './engine/formulas.js';
import * as seen from './seen.js';

const { exams } = pageData();
const app = $('#exam-app');
const TYPE = { short: 'เขียนตอบ', id: 'ดูรูปตอบ', draw: 'วาด/อธิบาย', tf: 'ถูก/ผิด', calc: 'คำนวณ' };
let state = { paper: location.hash.slice(1) || exams[0].id, filter: 'all' };
if (!exams.some((p) => p.id === state.paper)) state.paper = exams[0].id;

/** บันทึกว่าดูข้อนี้แล้ว + ติดป้ายเขียวบนการ์ด */
function markSeen(key) {
  const { p, q } = findQ(key);
  seen.mark(`Q:${key}`, { title: `ข้อ ${q.no} ${p.title.split(' หมวด')[0]}`, href: `exams.html#${p.id}`, kind: 'ข้อสอบเก่า' });
  const s = new Set(store.get().examSeen || []);
  s.add(key);
  store.set({ examSeen: [...s] });
  paintCard(key);
  paintTabs();
}
function paintCard(key) {
  const el = document.getElementById(`q-${key.replace(/[:.]/g, '-')}`);
  if (!el) return;
  const item = seen.get(`Q:${key}`);
  el.classList.toggle('is-seen', !!item);
  const h = $('.qhead', el);
  $('.seen', h)?.remove();
  if (item) h.insertAdjacentHTML('beforeend', seen.badge(`Q:${key}`, item));
}
function paperCount(p) { return p.questions.filter((q) => seen.get(`Q:${p.id}:${q.no}`)).length; }
function paintTabs() {
  $$('.paper-tab', app).forEach((t) => {
    const p = exams.find((x) => x.id === t.dataset.paper);
    const n = paperCount(p);
    $('[data-tab-count]', t).textContent = n ? ` · ดูแล้ว ${n}` : '';
    $('.bar > i', t).style.setProperty('--w', `${Math.round((n / p.questions.length) * 100)}%`);
  });
}
addEventListener('seen:change', (e) => { if (e.detail.key.startsWith('Q:') || e.detail.key === '*') { paintTabs(); if (e.detail.key !== '*') paintCard(e.detail.key.slice(2)); else render(); } });

function render() {
  const p = exams.find((x) => x.id === state.paper);
  const qs = p.questions.filter((q) => state.filter === 'all' || (state.filter === 'calc' ? q.type === 'calc' : state.filter === 'todo' ? !seen.get(`Q:${p.id}:${q.no}`) : q.warn));
  app.innerHTML = `
    <div class="paper-tabs" role="tablist">${exams.map((x) => `<button class="paper-tab ${x.id === p.id ? 'is-on' : ''}" role="tab" aria-selected="${x.id === p.id}" data-paper="${x.id}">${esc(x.title.split(' หมวด')[0])}<small>${x.topic === 'welding' ? 'Welding' : 'Sheet Metal'} · ${x.questions.length} ข้อ<span data-tab-count></span></small><div class="bar"><i></i></div></button>`).join('')}</div>
    <h2 style="margin:0 0 4px;font-size:1.25rem">${esc(p.title)}</h2>
    <p class="paper-note">${esc(p.note || '')}</p>
    <div class="filters"><div class="seg" role="group" aria-label="กรองข้อ">
      ${[['all', 'ทุกข้อ'], ['todo', 'ยังไม่ได้ดู'], ['calc', 'เฉพาะข้อคำนวณ'], ['warn', 'เฉลยรุ่นพี่ผิด/ต้องระวัง']].map(([k, l]) => `<button type="button" class="seg-btn ${state.filter === k ? 'is-on' : ''}" data-filter="${k}">${l}</button>`).join('')}
    </div></div>
    ${qs.length ? qs.map((q) => card(p, q)).join('') : `<p class="note">${state.filter === 'todo' ? 'ดูครบทุกข้อในชุดนี้แล้ว เก่งมาก' : 'ชุดนี้ไม่มีข้อในหมวดที่เลือก'}</p>`}`;
  qs.forEach((q) => paintCard(`${p.id}:${q.no}`));
  requestAnimationFrame(paintTabs);
}

function card(p, q) {
  const key = `${p.id}:${q.no}`;
  const head = `<div class="qhead"><span class="qno">ข้อ ${esc(q.no)}</span><span class="chip ${q.type === 'calc' ? 'chip-arc' : ''}">${TYPE[q.type]}</span><span class="chip">${q.pts} คะแนน</span>${q.warn ? '<span class="chip chip-warn">ระวัง</span>' : ''}</div>`;
  let actions = '';
  if (q.type === 'calc') actions = `<button class="btn btn-primary btn-sm" data-act="solve" data-key="${key}">ดูเฉลยทันที</button><button class="btn btn-sm" data-act="steps" data-key="${key}">ทำทีละขั้น</button>`;
  else if (q.type === 'tf') actions = `<div class="tf-row"><button class="btn btn-sm" data-act="tf" data-v="1" data-key="${key}">ถูก</button><button class="btn btn-sm" data-act="tf" data-v="0" data-key="${key}">ผิด</button></div>`;
  else actions = `<button class="btn btn-sm" data-act="reveal" data-key="${key}">ดูเฉลย</button>`;
  return `<article class="qcard" id="q-${key.replace(/[:.]/g, '-')}">${head}<div class="qtext">${q.qHtml}</div>${q.figHtml ? `<div class="qfigs">${q.figHtml}</div>` : ''}<div class="qactions">${actions}</div><div class="qout" data-out="${key}"></div></article>`;
}

function findQ(key) {
  const [pid, no] = key.split(':');
  const p = exams.find((x) => x.id === pid);
  return { p, q: p.questions.find((x) => x.no === no) };
}

function answerHtml(q, extra = '') {
  return `<div class="answer ${q.warn ? 'is-warn' : ''}"><div class="lbl">เฉลย</div><div>${q.aHtml || ''}</div>${extra}${q.whyHtml ? `<div class="why">${q.whyHtml}</div>` : ''}${q.aws ? '<div class="why"><a href="aws.html#seq">ดูรูปสัญลักษณ์คำตอบในหน้า AWS</a></div>' : ''}</div>`;
}

function solveHtml(q) {
  const P = PROBLEMS[q.problem]();
  const steps = P.parts[q.part];
  const last = steps[steps.length - 1];
  return `${stepsHtml(steps)}<div class="final">${q.part === 'lb' && P.summary ? tex(P.summary) : `คำตอบ ${tex(unitTex(last.value, last.unit))}${last.unit === 'N' ? ` ≈ ${tex(unitTex(last.value / 1000, 'kN'))}` : ''}`}</div>${q.whyHtml ? `<div class="answer"><div class="why">${q.whyHtml}</div></div>` : ''}`;
}

// ---------- โหมดทำทีละขั้น ----------
function stepMode(out, q) {
  const P = PROBLEMS[q.problem]();
  const steps = P.parts[q.part];
  const keys = Object.keys(FORMULA_CHOICES);
  let i = 0;
  out.innerHTML = `<p class="feedback">แต่ละขั้น: เลือกสูตรที่ใช้ก่อน แล้วพิมพ์ตัวเลขที่คำนวณได้ (ยอมคลาดเคลื่อน 1%) ผิด 3 ครั้งระบบจะเฉลยให้</p><ol class="steps">${steps.map((s, k) => `<li class="step ${k ? 'is-locked' : ''}" data-step="${k}"><div class="step-title">${esc(s.title)}</div><div class="step-body"></div></li>`).join('')}</ol><div class="step-final"></div>`;
  const run = () => {
    if (i >= steps.length) {
      const last = steps[steps.length - 1];
      $('.step-final', out).innerHTML = `<div class="final">ทำครบทุกขั้นแล้ว ${q.part === 'lb' && P.summary ? tex(P.summary) : tex(unitTex(last.value, last.unit))}</div>`;
      return;
    }
    const s = steps[i];
    const li = $(`[data-step="${i}"]`, out);
    li.classList.remove('is-locked');
    const body = $('.step-body', li);
    const hasChoice = s.id in FORMULA_CHOICES;
    let tries = 0;
    const askNumber = () => {
      body.insertAdjacentHTML('beforeend', `<div class="step-math">${tex(s.formula, true)}</div>${s.explain ? `<div class="step-explain">${esc(s.explain)}</div>` : ''}
        <div class="num-row"><label for="n-${q.no}-${i}">ผลลัพธ์${s.unit ? ` (${esc(s.unit)})` : ''}</label><input id="n-${q.no}-${i}" type="text" inputmode="decimal" autocomplete="off"><button class="btn btn-sm btn-primary" type="button" data-check>ตรวจ</button><button class="btn btn-sm btn-ghost" type="button" data-give>ขอดูเฉลยขั้นนี้</button></div><div class="feedback" aria-live="polite"></div>`);
      const inp = $('input', body), fb = $('.feedback:last-child', body);
      inp.focus();
      const reveal = (ok) => {
        $('.num-row', body).remove();
        fb.className = `feedback ${ok ? 'ok' : 'bad'}`;
        fb.innerHTML = `${ok ? 'ถูกต้อง' : 'เฉลยขั้นนี้'} ${tex(`${s.sub} = ${unitTex(s.value, s.unit)}`)}`;
        i++; run();
      };
      const check = () => {
        const r = checkNum(inp.value, s.value);
        if (r === null) { fb.className = 'feedback bad'; fb.textContent = 'พิมพ์เป็นตัวเลข เช่น 3.134'; return; }
        if (r) return reveal(true);
        tries++;
        if (tries >= 3) return reveal(false);
        fb.className = 'feedback bad';
        fb.textContent = `ยังไม่ถูก (ครั้งที่ ${tries}/3) ลองตรวจการแทนค่าและหน่วยอีกครั้ง${s.unit === 'N' ? ' คำตอบขั้นนี้เป็นนิวตัน (N) ไม่ใช่ kN' : ''}`;
      };
      $('[data-check]', body).addEventListener('click', check);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
      $('[data-give]', body).addEventListener('click', () => reveal(false));
    };
    if (!hasChoice) return askNumber();
    const opts = shuffle([s.id, ...shuffle(keys.filter((k) => k !== s.id && FORMULA_CHOICES[k] !== FORMULA_CHOICES[s.id])).slice(0, 2)]);
    body.innerHTML = `<div class="step-explain">ขั้นนี้ใช้สูตรไหน</div><div class="choice-row">${opts.map((k) => `<button type="button" class="choice" data-k="${k}">${tex(FORMULA_CHOICES[k])}</button>`).join('')}</div><div class="feedback" aria-live="polite"></div>`;
    $$('.choice', body).forEach((b) => b.addEventListener('click', () => {
      const fb = $('.feedback', body);
      if (b.dataset.k === s.id) {
        b.classList.add('is-right');
        $$('.choice', body).forEach((x) => (x.disabled = true));
        fb.className = 'feedback ok'; fb.textContent = 'ถูกต้อง ลองแทนค่าต่อ';
        askNumber();
      } else { b.classList.add('is-wrong'); b.disabled = true; fb.className = 'feedback bad'; fb.textContent = 'ยังไม่ใช่ ลองคิดว่าขั้นนี้กำลังหาอะไร'; }
    }));
  };
  run();
}

app.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-paper]');
  if (tab) { state.paper = tab.dataset.paper; history.replaceState(null, '', '#' + state.paper); render(); return; }
  const f = e.target.closest('[data-filter]');
  if (f) { state.filter = f.dataset.filter; render(); return; }
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const key = b.dataset.key;
  const { q } = findQ(key);
  const out = $(`[data-out="${CSS.escape(key)}"]`, app);
  markSeen(key);
  if (b.dataset.act === 'reveal') out.innerHTML = answerHtml(q);
  else if (b.dataset.act === 'tf') {
    const ok = (b.dataset.v === '1') === q.tf;
    $$(`[data-act="tf"][data-key="${CSS.escape(key)}"]`, app).forEach((x) => { x.disabled = true; x.classList.toggle(((x.dataset.v === '1') === q.tf) ? 'is-right' : 'is-wrong', x === b || (x.dataset.v === '1') === q.tf); });
    out.innerHTML = answerHtml({ ...q, aHtml: `${ok ? 'ตอบถูก' : 'ยังไม่ถูก'} ข้อนี้ <b>${q.tf ? 'ถูก' : 'ผิด'}</b>` });
  } else if (b.dataset.act === 'solve') out.innerHTML = solveHtml(q);
  else if (b.dataset.act === 'steps') stepMode(out, q);
});

render();
void fmtNum;
