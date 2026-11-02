import * as C from './core.js';
import { loadBank, updateBankFromGov } from './data.js';

const { state, bank, TOPICS, EXAM } = C;
const $ = (s, el = document) => el.querySelector(s);
const app = $('#app');
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const KEYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
const pct = (x) => Math.round(x * 100);

// ---------- platform helpers ----------
const Cap = window.Capacitor;
function buzz(ms) {
  if (!state.settings.vibrate) return;
  try {
    const H = Cap?.Plugins?.Haptics;
    if (H) H.vibrate({ duration: ms });
    else navigator.vibrate?.(ms);
  } catch {}
}
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2200);
}
function applySettings() {
  const r = document.documentElement;
  if (state.settings.theme === 'auto') r.removeAttribute('data-theme');
  else r.dataset.theme = state.settings.theme;
  r.style.setProperty('--fs', state.settings.fs + 'px');
}
function setTitle(t, { back = true, extra = '' } = {}) {
  $('#title').textContent = t;
  $('#backBtn').hidden = !back;
  const ex = $('#topExtra');
  ex.textContent = extra;
  ex.className = 'topbar-extra';
}
function closeModal() {
  const m = $('#modal');
  m.hidden = true;
  m.innerHTML = '';
}
function showImage(src) {
  const m = $('#modal');
  m.innerHTML = `<img src="${esc(src)}" alt="">`;
  m.hidden = false;
  m.onclick = closeModal;
}
function confirmBox(text, okLabel = 'אישור') {
  return new Promise((res) => {
    const m = $('#modal');
    m.innerHTML = `<div class="sheet stack"><p>${esc(text)}</p>
      <div class="btn-row"><button class="btn primary" data-v="1">${esc(okLabel)}</button><button class="btn" data-v="0">ביטול</button></div></div>`;
    m.hidden = false;
    m.onclick = (e) => {
      const b = e.target.closest('[data-v]');
      if (!b && e.target !== m) return;
      closeModal();
      res(b?.dataset.v === '1');
    };
  });
}
function imgTag(q) {
  if (!q.img) return '';
  const fallback = q.imgRemote ? ` onerror="if(this.src!=='${esc(q.imgRemote)}')this.src='${esc(q.imgRemote)}'"` : '';
  return `<img class="qimg" src="${esc(q.img)}" alt="תמונה לשאלה" data-zoom="${esc(q.img)}"${fallback}>`;
}

// ---------- router ----------
let route = '';
let timerInterval = null;
const routes = {};
function go(path, replace = false) {
  if (replace) history.replaceState(null, '', '#' + path);
  else history.pushState(null, '', '#' + path);
  render();
}
function render() {
  clearInterval(timerInterval);
  closeModal();
  route = location.hash.slice(1) || '/';
  const [path, qs] = route.split('?');
  const params = new URLSearchParams(qs);
  (routes[path] ?? routes['/'])(params);
  app.focus({ preventScroll: true });
  scrollTo(0, 0);
}
addEventListener('popstate', render);
$('#backBtn').onclick = () => back();
function back() {
  if (!$('#modal').hidden) return closeModal();
  if (route.startsWith('/session') && session && session.answered > 0 && session.i < session.queue.length) {
    confirmBox('לצאת מהתרגול? ההתקדמות שכבר ענית נשמרה.', 'יציאה').then((ok) => ok && go('/', true));
    return;
  }
  if (route === '/' || route === '') {
    Cap?.Plugins?.App?.exitApp?.();
    return;
  }
  if (history.length > 1) history.back();
  else go('/', true);
}
Cap?.Plugins?.App?.addListener?.('backButton', back);

app.addEventListener('click', (e) => {
  const z = e.target.closest('[data-zoom]');
  if (z) return showImage(z.dataset.zoom);
  const a = e.target.closest('[data-go]');
  if (a) go(a.dataset.go);
});

// ---------- home ----------
function ring(value, label, sub) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const color = value >= 0.8 ? 'var(--good)' : value >= 0.4 ? 'var(--primary)' : 'var(--warn)';
  return `<div class="ring" role="img" aria-label="${esc(label)} ${pct(value)}%">
    <svg width="104" height="104" viewBox="0 0 104 104"><circle cx="52" cy="52" r="${r}" fill="none" stroke="var(--line)" stroke-width="10"/>
    <circle cx="52" cy="52" r="${r}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - value)}"/></svg>
    <div class="val"><div><b>${pct(value)}%</b><br><span>${esc(sub)}</span></div></div></div>`;
}

routes['/'] = () => {
  setTitle('תאוריה בכיס', { back: false });
  const t = C.totals();
  const rd = C.readiness();
  const done = C.todayCount();
  const goal = state.settings.goal;
  const daily = C.buildDaily();
  const st = C.streak();
  const nMist = C.mistakes().length;
  const exam = state.exam;
  const lastExam = state.exams.at(-1);
  app.innerHTML = `
    ${!bank.official ? `<div class="banner">מוצג סט תרגול מובנה (${bank.list.length} שאלות). את מאגר השאלות הרשמי המלא אפשר להוריד ב<a href="#/settings">הגדרות</a>.</div>` : ''}
    <section class="card">
      <div class="hero">
        ${ring(rd.pass, 'סיכוי לעבור', 'סיכוי לעבור')}
        <div class="stack" style="flex:1">
          <div><b>${t.seen === 0 ? 'בוא נתחיל!' : rd.pass >= 0.8 ? 'נראה שאתה מוכן 💪' : rd.pass >= 0.4 ? 'בדרך הנכונה' : 'ממשיכים להתאמן'}</b></div>
          <div class="muted small">ציון צפוי במבחן: ${Math.round(rd.expected)}/${EXAM.size} (עוברים ב־${EXAM.size - EXAM.maxMistakes})</div>
          <div class="small">יעד יומי: ${Math.min(done, goal)}/${goal}</div>
          <div class="bar good"><i style="width:${Math.min(100, (done / goal) * 100)}%"></i></div>
        </div>
      </div>
    </section>
    ${exam ? `<button class="btn primary" data-go="/exam" style="margin-bottom:14px">⏱️ המשך את המבחן שהתחלת</button>` : ''}
    <section class="card stack">
      <h2>תרגול יומי</h2>
      <p class="muted small" style="margin:0">${
        daily.length
          ? `${Math.min(t.due, daily.length)} שאלות לחזרה + ${daily.length - Math.min(t.due, daily.length)} חדשות. שאלות שטעית בהן יחזרו עד שתשלוט בהן.`
          : 'סיימת את החזרות להיום 🎉 אפשר להמשיך בתרגול נוסף.'
      }</p>
      <button class="btn primary" id="startDaily">${daily.length ? `התחל (${daily.length} שאלות)` : 'תרגול נוסף'}</button>
    </section>
    <div class="tiles">
      <button class="tile" data-go="/exam-intro"><span class="ico">📝</span><b>מבחן מלא</b><span>${EXAM.size} שאלות · ${EXAM.minutes} דק׳${lastExam ? ` · אחרון: ${lastExam.score}/${lastExam.total}` : ''}</span></button>
      <button class="tile" data-go="/topics"><span class="ico">📚</span><b>לפי נושא</b><span>תמרורים, חוקים, בטיחות, רכב</span></button>
      <button class="tile" data-go="/list?kind=mistakes"><span class="ico">🔁</span><b>הטעויות שלי</b><span>${nMist} שאלות לחיזוק</span></button>
      <button class="tile" data-go="/list?kind=marks"><span class="ico">⭐</span><b>מסומנות</b><span>${state.marks.length} שאלות</span></button>
      <button class="tile" data-go="/progress"><span class="ico">📈</span><b>התקדמות</b><span>🔥 רצף ${st} ימים</span></button>
      <button class="tile" data-go="/browse"><span class="ico">🔎</span><b>מאגר השאלות</b><span>${t.known}/${t.total} שולט</span></button>
    </div>
    <section class="card stats3">
      <div><b>${t.seen}</b><span>נלמדו</span></div>
      <div><b>${t.known}</b><span>בשליטה</span></div>
      <div><b>${t.due}</b><span>לחזרה היום</span></div>
    </section>
    <button class="btn ghost" data-go="/settings">⚙️ הגדרות</button>`;
  $('#startDaily').onclick = () =>
    startSession(daily.length ? daily : C.buildExtra(goal), daily.length ? 'תרגול יומי' : 'תרגול נוסף');
};

// ---------- practice session ----------
let session = null;
function startSession(ids, title) {
  if (!ids.length) return toast('אין שאלות לתרגול כאן עדיין');
  session = { title, queue: [...ids], i: 0, answered: 0, correct: 0, re: {}, wrongIds: new Set(), cur: null, start: Date.now() };
  go('/session');
}

routes['/session'] = () => {
  if (!session) return go('/', true);
  if (session.i >= session.queue.length) return sessionSummary();
  const id = session.queue[session.i];
  const q = bank.byId.get(id);
  if (!q) {
    session.i++;
    return render();
  }
  if (!session.cur || session.cur.id !== id || session.cur.pos !== session.i) {
    const c0 = C.card(id);
    const tag = !c0 ? 'חדשה' : session.re[id] ? 'שוב – לחיזוק' : 'חזרה';
    session.cur = { id, pos: session.i, order: C.shuffle(q.a.map((_, k) => k)), chosen: null, tag };
  }
  const cur = session.cur;
  setTitle(session.title, { extra: `${session.i + 1}/${session.queue.length}` });
  const tag = cur.tag;
  const answered = cur.chosen != null;
  const ok = answered && cur.chosen === q.c;
  app.innerHTML = `
    <div class="progress-dots"><i style="width:${(session.i / session.queue.length) * 100}%"></i></div>
    <section class="card">
      <div class="qmeta"><span>${TOPICS[q.t]?.ico ?? ''} ${esc(TOPICS[q.t]?.name ?? '')}${q.n ? ` · שאלה ${q.n}` : ''}</span><span>${tag}</span></div>
      <div class="qtext">${esc(q.q)}</div>
      ${imgTag(q)}
      <div class="answers">
        ${cur.order
          .map((k, i) => {
            let cls = '';
            if (answered) cls = k === q.c ? 'correct' : k === cur.chosen ? 'wrong' : 'dim';
            return `<button class="ans ${cls}" data-k="${k}" ${answered ? 'disabled' : ''}><span class="key">${KEYS[i]}</span><span>${esc(q.a[k])}</span></button>`;
          })
          .join('')}
      </div>
      ${
        answered
          ? `<div class="feedback ${ok ? 'good' : 'bad'}">${ok ? '✓ נכון!' : '✗ לא נכון – התשובה הנכונה מסומנת בירוק'}${q.ex ? `<p>${esc(q.ex)}</p>` : ''}${!ok ? '<p class="small muted">השאלה תחזור שוב בעוד כמה שאלות.</p>' : ''}</div>`
          : ''
      }
      <div class="actions">
        <button class="chip ${C.isMarked(id) ? 'on' : ''}" id="markBtn">${C.isMarked(id) ? '⭐ מסומנת' : '☆ סמן'}</button>
        ${!answered ? `<button class="chip" id="dontKnow">לא יודע/ת</button>` : ''}
      </div>
    </section>
    ${answered ? `<button class="btn primary" id="nextBtn">${session.i + 1 >= session.queue.length ? 'סיום' : 'הבא ←'}</button>` : ''}`;

  app.querySelectorAll('.ans:not([disabled])').forEach((b) => (b.onclick = () => answer(+b.dataset.k)));
  $('#markBtn').onclick = () => {
    toast(C.toggleMark(id) ? 'נוספה למסומנות' : 'הוסרה מהמסומנות');
    render();
  };
  const dk = $('#dontKnow');
  if (dk) dk.onclick = () => answer(-1);
  const nx = $('#nextBtn');
  if (nx) {
    nx.onclick = next;
    nx.focus({ preventScroll: true });
    nx.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function answer(k) {
    cur.chosen = k;
    const correct = k === q.c;
    // Re-asked questions within the same session do not move the card up again.
    if (!session.re[id] || !correct) C.grade(id, correct);
    session.answered++;
    if (correct) session.correct++;
    else {
      session.wrongIds.add(id);
      const n = (session.re[id] ?? 0) + 1;
      if (n <= 2) {
        session.re[id] = n;
        session.queue.splice(Math.min(session.queue.length, session.i + 4), 0, id);
      }
    }
    buzz(correct ? 15 : 60);
    render();
  }
  function next() {
    session.i++;
    session.cur = null;
    render();
  }
};

function sessionSummary() {
  setTitle('סיכום תרגול');
  const s = session;
  const acc = s.answered ? s.correct / s.answered : 0;
  const mins = Math.max(1, Math.round((Date.now() - s.start) / 60000));
  const wrong = [...s.wrongIds];
  app.innerHTML = `
    <section class="card center stack">
      <div style="font-size:2.6rem">${acc >= 0.9 ? '🏆' : acc >= 0.7 ? '👏' : '💪'}</div>
      <h2>${acc >= 0.9 ? 'מצוין!' : acc >= 0.7 ? 'עבודה טובה!' : 'כל טעות היא שיעור'}</h2>
      <div class="stats3"><div><b>${s.answered}</b><span>תשובות</span></div><div><b>${pct(acc)}%</b><span>דיוק</span></div><div><b>${mins}</b><span>דקות</span></div></div>
      <p class="muted small" style="margin:0">היעד היומי: ${Math.min(C.todayCount(), state.settings.goal)}/${state.settings.goal} · 🔥 רצף ${C.streak()} ימים</p>
    </section>
    ${
      wrong.length
        ? `<section class="card"><h3>שאלות שכדאי לחזור עליהן</h3><ul class="list">${wrong
            .map((id) => {
              const q = bank.byId.get(id);
              return `<li><div>${esc(q.q)}</div><div class="ok small">✓ ${esc(q.a[q.c])}</div></li>`;
            })
            .join('')}</ul></section>`
        : ''
    }
    <div class="stack">
      <button class="btn primary" id="more">עוד סבב תרגול</button>
      <button class="btn" data-go="/">למסך הבית</button>
    </div>`;
  $('#more').onclick = () => {
    const d = C.buildDaily();
    startSession(d.length ? d : C.buildExtra(state.settings.goal), d.length ? 'תרגול יומי' : 'תרגול נוסף');
  };
  session.i = Infinity;
}

// ---------- topics ----------
routes['/topics'] = () => {
  setTitle('תרגול לפי נושא');
  const ts = C.topicStats();
  app.innerHTML = Object.entries(ts)
    .sort((a, b) => b[1].total - a[1].total)
    .map(
      ([k, s]) => `<section class="card stack">
        <div class="row between"><h2 style="margin:0">${TOPICS[k]?.ico ?? ''} ${esc(TOPICS[k]?.name ?? k)}</h2><span class="muted small">${s.known}/${s.total} בשליטה</span></div>
        <div class="bar stack3"><i class="m" style="width:${(s.known / s.total) * 100}%"></i><i class="l" style="width:${(s.learning / s.total) * 100}%"></i></div>
        <div class="btn-row"><button class="btn primary" data-topic="${k}">תרגול (20)</button><button class="btn" data-browse="${k}">עיון</button></div>
      </section>`
    )
    .join('') + `<p class="muted small center">ירוק = בשליטה · כתום = בלמידה · אפור = טרם נלמד</p>`;
  app.querySelectorAll('[data-topic]').forEach(
    (b) => (b.onclick = () => startSession(C.buildTopic(b.dataset.topic), TOPICS[b.dataset.topic]?.name ?? 'נושא'))
  );
  app.querySelectorAll('[data-browse]').forEach((b) => (b.onclick = () => go('/browse?t=' + b.dataset.browse)));
};

// ---------- mistakes / marked ----------
routes['/list'] = (p) => {
  const kind = p.get('kind');
  const isM = kind === 'mistakes';
  setTitle(isM ? 'הטעויות שלי' : 'שאלות מסומנות');
  const ids = (isM ? C.mistakes() : state.marks.filter((id) => bank.byId.has(id)));
  if (!ids.length) {
    app.innerHTML = `<div class="empty"><div class="ico">${isM ? '✨' : '⭐'}</div><p>${
      isM ? 'אין כרגע טעויות לחיזוק. שאלות שתטעה בהן יופיעו כאן עד שתענה עליהן נכון כמה פעמים.' : 'עוד לא סימנת שאלות. לחץ על "☆ סמן" בזמן תרגול כדי לשמור שאלה.'
    }</p></div>`;
    return;
  }
  app.innerHTML = `<button class="btn primary" id="go" style="margin-bottom:14px">תרגל את כולן (${Math.min(ids.length, 30)})</button>
    <section class="card"><ul class="list">${ids
      .map((id) => {
        const q = bank.byId.get(id);
        const c = C.card(id);
        return `<li><div>${esc(q.q)}</div><div class="ok small">✓ ${esc(q.a[q.c])}</div>${c ? `<div class="muted small">טעויות: ${c.w} · נכון: ${c.r}</div>` : ''}</li>`;
      })
      .join('')}</ul></section>`;
  $('#go').onclick = () => startSession(C.shuffle([...ids]).slice(0, 30), isM ? 'חיזוק טעויות' : 'מסומנות');
};

// ---------- browse ----------
routes['/browse'] = (p) => {
  setTitle('מאגר השאלות');
  const topic = p.get('t') ?? '';
  let shown = 40;
  app.innerHTML = `
    <input class="input" id="search" type="search" placeholder="חיפוש בשאלות ובתשובות…" autocomplete="off">
    <div class="seg" style="margin:10px 0 14px">${['', ...Object.keys(C.topicStats())]
      .map((k) => `<button data-t="${k}" class="${k === topic ? 'on' : ''}">${k ? esc(TOPICS[k]?.name ?? k) : 'הכל'}</button>`)
      .join('')}</div>
    <div id="count" class="muted small"></div>
    <section class="card"><ul class="list" id="res"></ul></section>
    <button class="btn" id="moreBtn">הצג עוד</button>`;
  const draw = () => {
    const s = $('#search').value.trim();
    const res = bank.list.filter((q) => (!topic || q.t === topic) && (!s || q.q.includes(s) || q.a.some((a) => a.includes(s))));
    $('#count').textContent = `${res.length} שאלות`;
    $('#res').innerHTML = res
      .slice(0, shown)
      .map((q) => {
        const c = C.card(q.id);
        const lv = !c ? '' : c.b >= C.KNOWN_BOX ? ' · ✅ בשליטה' : ' · 🟠 בלמידה';
        return `<li><div class="muted small">${q.n ? `#${q.n} · ` : ''}${esc(TOPICS[q.t]?.name ?? '')}${lv}</div><div>${esc(q.q)}</div>${
          q.img ? `<img class="qimg" style="max-height:110px;margin:8px 0" loading="lazy" src="${esc(q.img)}" data-zoom="${esc(q.img)}" alt="">` : ''
        }<details><summary class="small muted">הצג תשובה</summary><div class="ok">✓ ${esc(q.a[q.c])}</div>${q.ex ? `<div class="small">${esc(q.ex)}</div>` : ''}</details></li>`;
      })
      .join('');
    $('#moreBtn').hidden = res.length <= shown;
  };
  let tmr;
  $('#search').oninput = () => {
    clearTimeout(tmr);
    tmr = setTimeout(() => ((shown = 40), draw()), 200);
  };
  $('#moreBtn').onclick = () => ((shown += 40), draw());
  app.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => go('/browse' + (b.dataset.t ? '?t=' + b.dataset.t : ''), true)));
  draw();
};

// ---------- exam ----------
routes['/exam-intro'] = () => {
  setTitle('מבחן מלא');
  app.innerHTML = `<section class="card stack">
    <h2>סימולציה של מבחן התאוריה</h2>
    <ul class="small" style="margin:0;padding-inline-start:20px">
      <li>${EXAM.size} שאלות מכל הנושאים</li><li>${EXAM.minutes} דקות</li>
      <li>עוברים עם ${EXAM.maxMistakes} טעויות לכל היותר (${EXAM.size - EXAM.maxMistakes} תשובות נכונות)</li>
      <li>אין משוב עד סוף המבחן – כמו במבחן האמיתי. אפשר לחזור לשאלות ולשנות תשובה.</li>
    </ul>
    <button class="btn primary" id="startExam">${state.exam ? 'המשך את המבחן הפתוח' : 'התחל מבחן'}</button>
    ${state.exam ? `<button class="btn danger" id="newExam">התחל מבחן חדש</button>` : ''}
  </section>
  ${state.exams.length ? `<section class="card"><h3>מבחנים קודמים</h3><ul class="list">${state.exams
    .slice(-8)
    .reverse()
    .map((e) => `<li class="row between"><span>${new Date(e.at).toLocaleDateString('he-IL')}</span><b style="color:${e.pass ? 'var(--good)' : 'var(--bad)'}">${e.score}/${e.total} ${e.pass ? 'עבר' : 'נכשל'}</b></li>`)
    .join('')}</ul></section>` : ''}`;
  $('#startExam').onclick = () => {
    if (!state.exam) newExam();
    go('/exam');
  };
  const n = $('#newExam');
  if (n) n.onclick = () => (newExam(), go('/exam'));
};
function newExam() {
  const ids = C.buildExam();
  state.exam = {
    ids,
    orders: ids.map((id) => C.shuffle(bank.byId.get(id).a.map((_, k) => k))),
    answers: ids.map(() => null),
    flags: [],
    i: 0,
    endAt: Date.now() + EXAM.minutes * 60000,
    startedAt: Date.now(),
  };
  C.save(true);
}
function fmtTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

routes['/exam'] = () => {
  const ex = state.exam;
  if (!ex) return go('/exam-intro', true);
  if (Date.now() >= ex.endAt) return finishExam(true);
  const id = ex.ids[ex.i];
  const q = bank.byId.get(id);
  setTitle('מבחן', { extra: fmtTime(ex.endAt - Date.now()) });
  const tick = () => {
    const left = ex.endAt - Date.now();
    const el = $('#topExtra');
    el.textContent = '⏱ ' + fmtTime(left);
    el.classList.toggle('urgent', left < 5 * 60000);
    if (left <= 0) finishExam(true);
  };
  tick();
  timerInterval = setInterval(tick, 1000);
  const nAns = ex.answers.filter((a) => a != null).length;
  const flagged = ex.flags.includes(ex.i);
  app.innerHTML = `
    <div class="progress-dots"><i style="width:${(nAns / ex.ids.length) * 100}%"></i></div>
    <section class="card">
      <div class="qmeta"><span>שאלה ${ex.i + 1} מתוך ${ex.ids.length}</span><span>נענו ${nAns}</span></div>
      <div class="qtext">${esc(q.q)}</div>
      ${imgTag(q)}
      <div class="answers">${ex.orders[ex.i]
        .map((k, i) => `<button class="ans ${ex.answers[ex.i] === k ? 'selected' : ''}" data-k="${k}"><span class="key">${KEYS[i]}</span><span>${esc(q.a[k])}</span></button>`)
        .join('')}</div>
      <div class="actions"><button class="chip ${flagged ? 'on' : ''}" id="flag">${flagged ? '⚑ מסומנת לבדיקה' : '⚐ סמן לבדיקה'}</button></div>
    </section>
    <div class="btn-row" style="margin-bottom:14px">
      <button class="btn" id="prev" ${ex.i === 0 ? 'disabled' : ''}>→ הקודמת</button>
      <button class="btn primary" id="nextQ">${ex.i + 1 >= ex.ids.length ? 'סקירה' : 'הבאה ←'}</button>
    </div>
    <section class="card"><div class="qgrid">${ex.ids
      .map((_, i) => `<button data-j="${i}" class="${ex.answers[i] != null ? 'answered' : ''} ${i === ex.i ? 'current' : ''} ${ex.flags.includes(i) ? 'flag' : ''}">${i + 1}</button>`)
      .join('')}</div></section>
    <button class="btn" id="submit">הגשת המבחן</button>`;
  const move = (j) => {
    ex.i = Math.max(0, Math.min(ex.ids.length - 1, j));
    C.save();
    render();
  };
  app.querySelectorAll('.ans').forEach(
    (b) =>
      (b.onclick = () => {
        ex.answers[ex.i] = +b.dataset.k;
        buzz(10);
        C.save();
        // Auto-advance to the next unanswered question after a short pause.
        setTimeout(() => {
          if (route !== '/exam') return;
          const nextUn = ex.answers.findIndex((a, j) => a == null && j > ex.i);
          move(nextUn >= 0 ? nextUn : ex.i);
        }, 250);
        app.querySelectorAll('.ans').forEach((x) => x.classList.toggle('selected', x === b));
      })
  );
  $('#flag').onclick = () => {
    const f = ex.flags.indexOf(ex.i);
    if (f >= 0) ex.flags.splice(f, 1);
    else ex.flags.push(ex.i);
    C.save();
    render();
  };
  $('#prev').onclick = () => move(ex.i - 1);
  $('#nextQ').onclick = () => {
    if (ex.i + 1 >= ex.ids.length) return askSubmit();
    move(ex.i + 1);
  };
  app.querySelectorAll('[data-j]').forEach((b) => (b.onclick = () => move(+b.dataset.j)));
  $('#submit').onclick = askSubmit;
  async function askSubmit() {
    const un = ex.answers.filter((a) => a == null).length;
    const msg = un ? `נשארו ${un} שאלות ללא תשובה (ייחשבו כטעות). להגיש בכל זאת?` : ex.flags.length ? `יש ${ex.flags.length} שאלות שסימנת לבדיקה. להגיש?` : 'להגיש את המבחן?';
    if (await confirmBox(msg, 'הגשה')) finishExam(false);
  }
};

function finishExam(timeUp) {
  const ex = state.exam;
  if (!ex) return;
  clearInterval(timerInterval);
  let score = 0;
  const detail = ex.ids.map((id, i) => {
    const q = bank.byId.get(id);
    const ok = ex.answers[i] === q.c;
    if (ok) score++;
    C.grade(id, ok);
    return { id, a: ex.answers[i], o: ex.orders[i] };
  });
  const total = ex.ids.length;
  const result = {
    at: Date.now(),
    score,
    total,
    pass: total - score <= EXAM.maxMistakes,
    secs: Math.round((Math.min(Date.now(), ex.endAt) - ex.startedAt) / 1000),
    timeUp,
    detail,
  };
  state.exams.push(result);
  if (state.exams.length > 30) state.exams.splice(0, state.exams.length - 30);
  // keep detail only for the last 5 exams to save space
  state.exams.slice(0, -5).forEach((e) => delete e.detail);
  state.exam = null;
  C.save(true);
  go('/exam-result', true);
}

routes['/exam-result'] = (p) => {
  const e = state.exams.at(-1);
  if (!e) return go('/', true);
  setTitle('תוצאות המבחן');
  const filter = p.get('f') ?? 'wrong';
  const items = (e.detail ?? []).map((d, i) => ({ ...d, i, q: bank.byId.get(d.id) })).filter((d) => d.q);
  const shown = items.filter((d) => filter === 'all' || d.a !== d.q.c);
  app.innerHTML = `
    <section class="card center stack">
      ${e.timeUp ? '<div class="muted">⏱ הזמן נגמר</div>' : ''}
      <div class="result-big ${e.pass ? 'good' : 'bad'}">${e.score}/${e.total}</div>
      <h2>${e.pass ? '🎉 עברת!' : 'לא עברת הפעם'}</h2>
      <p class="muted small" style="margin:0">${e.total - e.score} טעויות (מותר עד ${EXAM.maxMistakes}) · ${Math.round(e.secs / 60)} דקות</p>
      <p class="small" style="margin:0">${e.pass ? 'כדי להיות בטוח, נסה לעבור 3 מבחנים ברצף.' : 'הטעויות נוספו לתרגול היומי שלך – הן יחזרו עד שתשלוט בהן.'}</p>
    </section>
    <div class="seg" style="margin-bottom:14px"><button data-f="wrong" class="${filter === 'wrong' ? 'on' : ''}">טעויות (${items.filter((d) => d.a !== d.q.c).length})</button><button data-f="all" class="${filter === 'all' ? 'on' : ''}">כל השאלות</button></div>
    ${shown
      .map(
        (d) => `<section class="card"><div class="qmeta"><span>שאלה ${d.i + 1}</span><span>${d.a === d.q.c ? '✓' : d.a == null ? 'לא נענתה' : '✗'}</span></div>
        <div class="qtext">${esc(d.q.q)}</div>${imgTag(d.q)}
        <div class="answers">${d.o
          .map((k, j) => `<div class="ans ${k === d.q.c ? 'correct' : k === d.a ? 'wrong' : 'dim'}"><span class="key">${KEYS[j]}</span><span>${esc(d.q.a[k])}</span></div>`)
          .join('')}</div>${d.q.ex ? `<div class="feedback good"><p>${esc(d.q.ex)}</p></div>` : ''}</section>`
      )
      .join('') || '<div class="empty"><div class="ico">🏆</div><p>אין טעויות!</p></div>'}
    <div class="stack"><button class="btn primary" id="again">מבחן נוסף</button><button class="btn" data-go="/">למסך הבית</button></div>`;
  app.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => go('/exam-result?f=' + b.dataset.f, true)));
  $('#again').onclick = () => (newExam(), go('/exam'));
};

// ---------- progress ----------
routes['/progress'] = () => {
  setTitle('ההתקדמות שלי');
  const t = C.totals();
  const rd = C.readiness();
  const ts = C.topicStats();
  const td = C.today();
  const days = Array.from({ length: 14 }, (_, i) => td - 13 + i);
  const max = Math.max(state.settings.goal, ...days.map((d) => state.days[d]?.n ?? 0));
  const recent = state.exams.slice(-5);
  const passStreak = (() => {
    let n = 0;
    for (let i = state.exams.length - 1; i >= 0 && state.exams[i].pass; i--) n++;
    return n;
  })();
  app.innerHTML = `
    <section class="card stats3">
      <div><b>🔥 ${C.streak()}</b><span>ימי רצף</span></div>
      <div><b>${pct(rd.pass)}%</b><span>סיכוי לעבור</span></div>
      <div><b>${t.known}/${t.total}</b><span>בשליטה</span></div>
    </section>
    <section class="card">
      <h3>14 הימים האחרונים</h3>
      <svg viewBox="0 0 280 110" width="100%" role="img" aria-label="מספר תשובות ביום">
        <line x1="0" x2="280" y1="${100 - (state.settings.goal / max) * 90}" y2="${100 - (state.settings.goal / max) * 90}" stroke="var(--muted)" stroke-dasharray="3 3" stroke-width="1"/>
        ${days
          .map((d, i) => {
            const n = state.days[d]?.n ?? 0;
            const h = (n / max) * 90;
            const x = 280 - (i + 1) * 20 + 3;
            return `<rect x="${x}" y="${100 - h}" width="14" height="${Math.max(h, n ? 2 : 0)}" rx="3" fill="${n >= state.settings.goal ? 'var(--good)' : 'var(--primary)'}"><title>${C.dayLabel(d)}: ${n}</title></rect>`;
          })
          .join('')}
        <line x1="0" x2="280" y1="100" y2="100" stroke="var(--line)"/>
      </svg>
      <div class="row between muted small"><span>לפני שבועיים</span><span>קו מקווקו = היעד היומי</span><span>היום</span></div>
    </section>
    <section class="card stack">
      <h3>שליטה לפי נושא</h3>
      ${Object.entries(ts)
        .map(
          ([k, s]) => `<div><div class="row between small"><span>${TOPICS[k]?.ico ?? ''} ${esc(TOPICS[k]?.name ?? k)}</span><span class="muted">${pct(s.known / s.total)}%</span></div>
          <div class="bar stack3"><i class="m" style="width:${(s.known / s.total) * 100}%"></i><i class="l" style="width:${(s.learning / s.total) * 100}%"></i></div></div>`
        )
        .join('')}
    </section>
    <section class="card">
      <h3>מבחנים</h3>
      ${recent.length ? `<p class="small muted" style="margin-top:0">עברת ${passStreak} מבחנים ברצף · ${state.exams.filter((e) => e.pass).length}/${state.exams.length} עברו בסך הכל</p>
      <ul class="list">${recent
        .reverse()
        .map((e) => `<li class="row between"><span>${new Date(e.at).toLocaleDateString('he-IL')}</span><b style="color:${e.pass ? 'var(--good)' : 'var(--bad)'}">${e.score}/${e.total}</b></li>`)
        .join('')}</ul>` : '<p class="muted small">עוד לא עשית מבחן. כשהסיכוי לעבור עולה מעל 60%, זה זמן טוב לנסות.</p>'}
    </section>
    <section class="card small muted">
      <b>איך זה עובד?</b> האפליקציה משתמשת ב<b>חזרה מרווחת</b>: שאלה שעונים עליה נכון חוזרת אחרי 1, 2, 4, 8… ימים; שאלה שטועים בה חוזרת מיד ובאותו יום. כך משקיעים זמן בדיוק במה שעוד לא יודעים. "בשליטה" = נענתה נכון כמה פעמים לאורך כמה ימים.
    </section>`;
};

// ---------- settings ----------
routes['/settings'] = () => {
  setTitle('הגדרות');
  const s = state.settings;
  const stepper = (key, step, min, maxv) =>
    `<div class="stepper"><button data-step="${key}" data-d="${-step}" data-min="${min}" data-max="${maxv}" aria-label="פחות">−</button><b>${s[key]}</b><button data-step="${key}" data-d="${step}" data-min="${min}" data-max="${maxv}" aria-label="יותר">+</button></div>`;
  app.innerHTML = `
    <section class="card">
      <div class="setting"><span>יעד יומי (שאלות)</span>${stepper('goal', 5, 5, 100)}</div>
      <div class="setting"><span>שאלות חדשות ביום (מקסימום)</span>${stepper('newPerDay', 5, 0, 100)}</div>
      <div class="setting"><span>גודל טקסט</span>${stepper('fs', 1, 14, 24)}</div>
      <div class="setting"><span>ערכת צבעים</span><div class="seg">${[
        ['auto', 'אוטו׳'],
        ['light', 'בהיר'],
        ['dark', 'כהה'],
      ]
        .map(([v, l]) => `<button data-theme="${v}" class="${s.theme === v ? 'on' : ''}">${l}</button>`)
        .join('')}</div></div>
      <div class="setting"><span>רטט במשוב</span><div class="seg"><button data-vib="1" class="${s.vibrate ? 'on' : ''}">פעיל</button><button data-vib="0" class="${!s.vibrate ? 'on' : ''}">כבוי</button></div></div>
    </section>
    <section class="card stack">
      <h3>מאגר השאלות</h3>
      <p class="small muted" style="margin:0">${esc(bank.source)} · ${bank.list.length} שאלות${bank.generatedAt ? ` · עודכן ${new Date(bank.generatedAt).toLocaleDateString('he-IL')}` : ''}</p>
      <button class="btn" id="upd">⬇️ עדכון מאגר השאלות הרשמי (דורש אינטרנט)</button>
    </section>
    <section class="card stack">
      <h3>גיבוי</h3>
      <div class="btn-row"><button class="btn" id="exp">העתק גיבוי</button><button class="btn" id="imp">שחזור מגיבוי</button></div>
      <button class="btn danger" id="reset">איפוס כל ההתקדמות</button>
    </section>
    <p class="small muted">האפליקציה עובדת בלי אינטרנט. השאלות הרשמיות מתפרסמות ע״י משרד התחבורה כמידע פתוח. זו אפליקציית לימוד עצמאית שאינה קשורה למשרד התחבורה; במקרה של ספק – המקור הרשמי קובע.</p>`;
  app.querySelectorAll('[data-step]').forEach(
    (b) =>
      (b.onclick = () => {
        const k = b.dataset.step;
        s[k] = Math.max(+b.dataset.min, Math.min(+b.dataset.max, s[k] + +b.dataset.d));
        C.save();
        applySettings();
        render();
      })
  );
  app.querySelectorAll('[data-theme]').forEach((b) => (b.onclick = () => ((s.theme = b.dataset.theme), C.save(), applySettings(), render())));
  app.querySelectorAll('[data-vib]').forEach((b) => (b.onclick = () => ((s.vibrate = b.dataset.vib === '1'), C.save(), render())));
  $('#upd').onclick = async () => {
    const b = $('#upd');
    b.disabled = true;
    b.textContent = 'מוריד…';
    try {
      const n = await updateBankFromGov((m) => (b.textContent = m));
      toast(`עודכן: ${n} שאלות`);
      render();
    } catch (e) {
      console.warn(e);
      toast('העדכון נכשל – בדוק חיבור לאינטרנט ונסה שוב');
      b.disabled = false;
      b.textContent = '⬇️ נסה שוב';
    }
  };
  $('#exp').onclick = async () => {
    const code = C.exportProgress();
    try {
      await navigator.clipboard.writeText(code);
      toast('הגיבוי הועתק – שמור אותו בהודעה לעצמך');
    } catch {
      prompt('העתק את הקוד הזה ושמור אותו:', code);
    }
  };
  $('#imp').onclick = () => {
    const code = prompt('הדבק כאן את קוד הגיבוי:');
    if (!code) return;
    try {
      C.importProgress(code);
      applySettings();
      toast('ההתקדמות שוחזרה');
      render();
    } catch {
      toast('קוד הגיבוי לא תקין');
    }
  };
  $('#reset').onclick = async () => {
    if (await confirmBox('למחוק את כל ההתקדמות? אי אפשר לבטל.', 'מחיקה')) {
      C.resetProgress();
      toast('ההתקדמות אופסה');
      go('/', true);
    }
  };
};

// ---------- keyboard (handy on emulators / tablets with keyboard) ----------
addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea')) return;
  if (e.key === 'Escape') return back();
  const n = '1234'.indexOf(e.key);
  if (n >= 0) app.querySelectorAll('.ans:not([disabled])')[n]?.click();
  if (e.key === 'Enter') ($('#nextBtn') ?? $('#nextQ'))?.click();
});

// ---------- boot ----------
applySettings();
loadBank()
  .then((data) => {
    C.setBank(data);
    render();
    Cap?.Plugins?.SplashScreen?.hide?.();
  })
  .catch((e) => {
    app.innerHTML = `<div class="empty"><div class="ico">⚠️</div><p>שגיאה בטעינת השאלות</p><p class="small">${esc(e.message)}</p></div>`;
  });
