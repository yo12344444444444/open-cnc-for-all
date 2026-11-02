// Loads the question bank: a downloaded update (if any) > bundled official bank > built-in practice set.
import { parseRecords, fetchResource, DATAGOV } from './gov-parser.js';

const UPDATED_KEY = 'theory.bank.updated';

async function getJson(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(url + ' ' + r.status);
  return r.json();
}

export async function loadBank() {
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(UPDATED_KEY));
  } catch {}
  let bundled = null;
  try {
    bundled = await getJson('data/questions.json');
  } catch {}
  const pick = [stored, bundled]
    .filter((b) => b?.questions?.length)
    .sort((a, b) => (b.generatedAt ?? '').localeCompare(a.generatedAt ?? ''))[0];
  if (pick) {
    // Keep bundled offline images for questions that exist in both.
    if (pick === stored && bundled) {
      const local = new Map(bundled.questions.map((q) => [q.id, q]));
      for (const q of pick.questions) {
        const l = local.get(q.id);
        if (l?.img?.startsWith('img/')) {
          q.imgRemote = q.img;
          q.img = l.img;
        }
      }
    }
    return pick;
  }
  return getJson('data/fallback.json');
}

/** Download the latest official bank directly from data.gov.il (in the app). */
export async function updateBankFromGov(progress = () => {}) {
  let lastErr;
  for (const id of DATAGOV.resourceIds) {
    try {
      const recs = await fetchResource(id, fetch, progress);
      const questions = parseRecords(recs, { license: 'B' });
      if (questions.length < 300) throw new Error('too few questions: ' + questions.length);
      const data = {
        source: 'משרד התחבורה – מאגר שאלות התאוריה (data.gov.il)',
        official: true,
        generatedAt: new Date().toISOString(),
        questions,
      };
      localStorage.setItem(UPDATED_KEY, JSON.stringify(data));
      const fresh = await loadBank();
      const { setBank } = await import('./core.js');
      setBank(fresh);
      return questions.length;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error('no resource');
}
