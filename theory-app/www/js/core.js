// Core: persistent state, spaced-repetition scheduler, session builders, stats.
// Learning model (Leitner boxes):
//   box 0 = never seen. Correct answer -> next box, due after INTERVALS[box] days.
//   Wrong answer -> back to box 1, due today (and re-asked a few cards later in the session).
//   box >= KNOWN_BOX counts as "known".

const KEY = 'theory.state.v1';
export const INTERVALS = [0, 1, 2, 4, 8, 16, 32, 64];
export const MAX_BOX = INTERVALS.length - 1;
export const KNOWN_BOX = 3;
export const EXAM = { size: 30, minutes: 40, maxMistakes: 4 };
export const TOPICS = {
  rules: { name: 'חוקי התנועה', ico: '🚦' },
  signs: { name: 'תמרורים', ico: '⛔' },
  safety: { name: 'בטיחות', ico: '🛡️' },
  vehicle: { name: 'הכרת הרכב', ico: '🔧' },
  other: { name: 'כללי', ico: '📘' },
};

const DEFAULT_SETTINGS = { goal: 20, newPerDay: 20, testDate: '', theme: 'auto', fs: 17, vibrate: true };

export function today(d = new Date()) {
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
}
export function dayLabel(day) {
  const d = new Date(day * 86400000);
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', timeZone: 'UTC' });
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.v === 1) return s;
  } catch {}
  return null;
}

export const state = Object.assign(
  { v: 1, cards: {}, days: {}, exams: [], marks: [], lessons: {}, settings: {}, exam: null, created: Date.now() },
  load() ?? {}
);
state.settings = { ...DEFAULT_SETTINGS, ...state.settings };

let saveTimer = null;
export function save(now = false) {
  clearTimeout(saveTimer);
  const write = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('save failed', e);
    }
  };
  if (now) write();
  else saveTimer = setTimeout(write, 300);
}
addEventListener('pagehide', () => save(true));
document.addEventListener('visibilitychange', () => document.hidden && save(true));

export function resetProgress() {
  state.cards = {};
  state.days = {};
  state.exams = [];
  state.marks = [];
  state.lessons = {};
  state.exam = null;
  save(true);
}
export function exportProgress() {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}
export function importProgress(text) {
  const s = JSON.parse(decodeURIComponent(escape(atob(text.trim()))));
  if (!s || s.v !== 1 || typeof s.cards !== 'object') throw new Error('bad backup');
  Object.assign(state, s);
  state.lessons ??= {};
  state.settings = { ...DEFAULT_SETTINGS, ...state.settings };
  save(true);
}

// ---------- question bank ----------
export const bank = { list: [], byId: new Map(), source: '', official: false, generatedAt: null };
export function setBank(data) {
  bank.list = data.questions;
  bank.byId = new Map(data.questions.map((q) => [q.id, q]));
  bank.source = data.source;
  bank.official = !!data.official;
  bank.generatedAt = data.generatedAt ?? null;
}

// ---------- scheduling ----------
export function card(id) {
  return state.cards[id];
}
export function isDue(id, t = today()) {
  const c = state.cards[id];
  return !!c && c.due <= t;
}

/** Record an answer. Returns the updated card. */
export function grade(id, correct, { countDay = true } = {}) {
  const t = today();
  const c = state.cards[id] ?? { b: 0, due: t, s: 0, r: 0, w: 0, streak: 0 };
  const firstTime = c.s === 0;
  if (firstTime) c.first = t;
  c.s++;
  c.last = t;
  if (correct) {
    c.r++;
    c.streak = (c.streak ?? 0) + 1;
    // Already known on first sight: skip a box so it does not clog reviews.
    c.b = Math.min(MAX_BOX, c.b + (firstTime ? 2 : 1));
    c.due = t + INTERVALS[c.b];
  } else {
    c.w++;
    c.streak = 0;
    c.b = 1;
    c.due = t;
    c.lastWrong = t;
  }
  state.cards[id] = c;
  if (countDay) {
    const d = (state.days[t] ??= { n: 0, ok: 0 });
    d.n++;
    if (correct) d.ok++;
  }
  save();
  return c;
}

export function toggleMark(id) {
  const i = state.marks.indexOf(id);
  if (i >= 0) state.marks.splice(i, 1);
  else state.marks.push(id);
  save();
  return i < 0;
}
export const isMarked = (id) => state.marks.includes(id);

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export { shuffle };

/** Round-robin across topics so consecutive questions mix subjects (interleaving). */
function interleave(qs) {
  const groups = {};
  for (const q of shuffle([...qs])) (groups[q.t] ??= []).push(q);
  const lists = Object.values(groups);
  const out = [];
  while (lists.some((l) => l.length)) for (const l of lists) if (l.length) out.push(l.shift());
  return out;
}

export function newToday() {
  const t = today();
  let n = 0;
  for (const c of Object.values(state.cards)) if (c.first === t) n++;
  return n;
}

export function dueList(pool = bank.list) {
  const t = today();
  return pool
    .filter((q) => isDue(q.id, t))
    .sort((a, b) => state.cards[a.id].due - state.cards[b.id].due || state.cards[a.id].b - state.cards[b.id].b);
}
export function unseen(pool = bank.list) {
  return pool.filter((q) => !state.cards[q.id]);
}

/** Days left until the test date (null if not set). */
export function daysToTest() {
  const d = state.settings.testDate;
  if (!d) return null;
  const t = today(new Date(d + 'T12:00:00'));
  return Number.isFinite(t) ? t - today() : null;
}

/** New questions per day: the user's setting, raised if needed to cover the whole bank
 *  a few days before the test date (leaving the last days for review and exams). */
export function newTarget() {
  const base = state.settings.newPerDay;
  const left = daysToTest();
  if (left == null || left <= 0) return base;
  const studyDays = Math.max(1, left - 3);
  const remaining = unseen().length + newToday();
  return Math.max(base, Math.ceil(remaining / studyDays));
}

/** Daily session: due reviews first, then fresh questions (capped per day). */
export function buildDaily() {
  const size = state.settings.goal;
  const due = dueList().slice(0, size);
  const room = Math.max(0, Math.min(size - due.length, newTarget() - newToday()));
  const fresh = interleave(unseen()).slice(0, room);
  // Mix new items between reviews instead of a block at the end.
  const out = [...due];
  fresh.forEach((q, i) => out.splice(Math.min(out.length, i * 2 + 1), 0, q));
  return out.map((q) => q.id);
}

/** Extra practice when nothing is due: weakest seen questions first, then new. */
export function buildExtra(size = 20, pool = bank.list) {
  const seen = pool
    .filter((q) => state.cards[q.id])
    .sort((a, b) => strength(a.id) - strength(b.id));
  const fresh = interleave(unseen(pool));
  const weak = seen.filter((q) => strength(q.id) < 0.8);
  return [...weak.slice(0, Math.ceil(size / 2)), ...fresh, ...seen]
    .filter((q, i, arr) => arr.indexOf(q) === i)
    .slice(0, size)
    .map((q) => q.id);
}

export function buildTopic(topic, size = 20) {
  const pool = bank.list.filter((q) => q.t === topic);
  const due = dueList(pool);
  const rest = buildExtra(size, pool).filter((id) => !due.some((q) => q.id === id));
  return [...due.map((q) => q.id), ...rest].slice(0, size);
}

export function mistakes() {
  return bank.list
    .filter((q) => {
      const c = state.cards[q.id];
      return c && c.w > 0 && c.b < KNOWN_BOX;
    })
    .map((q) => q.id);
}

export function buildExam() {
  // Same share of each topic as in the bank, like the real test mixes topics.
  const byT = {};
  for (const q of bank.list) (byT[q.t] ??= []).push(q);
  const total = bank.list.length;
  const picks = [];
  const topics = Object.keys(byT);
  const quotas = topics.map((t) => ({ t, exact: (byT[t].length / total) * EXAM.size }));
  quotas.forEach((x) => (x.n = Math.floor(x.exact)));
  let left = EXAM.size - quotas.reduce((s, x) => s + x.n, 0);
  quotas.sort((a, b) => (b.exact - b.n) - (a.exact - a.n));
  for (const x of quotas) if (left > 0) (x.n++, left--);
  for (const x of quotas) picks.push(...shuffle([...byT[x.t]]).slice(0, x.n));
  return shuffle(picks).slice(0, EXAM.size).map((q) => q.id);
}

// ---------- stats ----------
/** Estimated probability of answering correctly, from the Leitner box. */
const P_BY_BOX = [0.35, 0.55, 0.7, 0.82, 0.9, 0.94, 0.96, 0.97];
export function strength(id) {
  const c = state.cards[id];
  return c ? P_BY_BOX[c.b] : P_BY_BOX[0];
}

function binomAtLeast(n, p, k) {
  let sum = 0;
  let coef = 1; // C(n, i)
  for (let i = 0; i <= n; i++) {
    if (i > 0) coef = (coef * (n - i + 1)) / i;
    if (i >= k) sum += coef * p ** i * (1 - p) ** (n - i);
  }
  return sum;
}

export function readiness() {
  if (!bank.list.length) return { pass: 0, expected: 0 };
  const p = bank.list.reduce((s, q) => s + strength(q.id), 0) / bank.list.length;
  return {
    pass: binomAtLeast(EXAM.size, p, EXAM.size - EXAM.maxMistakes),
    expected: p * EXAM.size,
  };
}

export function topicStats() {
  const out = {};
  for (const q of bank.list) {
    const o = (out[q.t] ??= { total: 0, known: 0, learning: 0, seen: 0 });
    o.total++;
    const c = state.cards[q.id];
    if (c) {
      o.seen++;
      if (c.b >= KNOWN_BOX) o.known++;
      else o.learning++;
    }
  }
  return out;
}

export function totals() {
  let seen = 0;
  let known = 0;
  for (const q of bank.list) {
    const c = state.cards[q.id];
    if (c) {
      seen++;
      if (c.b >= KNOWN_BOX) known++;
    }
  }
  return { seen, known, total: bank.list.length, due: dueList().length };
}

export function todayCount() {
  return state.days[today()]?.n ?? 0;
}

/** Consecutive days on which the daily goal (capped at 10) was reached. */
export function streak() {
  const need = Math.min(10, state.settings.goal);
  let t = today();
  let s = 0;
  if ((state.days[t]?.n ?? 0) >= need) s++;
  t--;
  while ((state.days[t]?.n ?? 0) >= need) {
    s++;
    t--;
  }
  return s;
}
