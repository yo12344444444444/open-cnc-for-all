// Parser for the official Israeli Ministry of Transport theory-question bank
// (published as open data on data.gov.il, CKAN datastore).
// Shared by the build script (Node) and the in-app "update question bank" feature.
// Kept defensive on purpose: field names / HTML shape may change over time.

export const TOPIC_MAP = {
  'חוקי התנועה': 'rules',
  'תמרורים': 'signs',
  'בטיחות': 'safety',
  'הכרת הרכב': 'vehicle',
};

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

function decode(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&([a-z#0-9]+);/gi, (m, n) => (n in ENTITIES ? ENTITIES[n] : m));
}

export function stripHtml(s) {
  return decode(String(s ?? '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function topicKey(cat) {
  const c = stripHtml(cat);
  for (const [he, key] of Object.entries(TOPIC_MAP)) if (c.includes(he)) return key;
  return 'other';
}

/**
 * Parse one CKAN record. Returns null if it does not look like a question.
 * @param {object} rec
 * @param {object} [opts] { license: 'B' }
 */
export function parseRecord(rec, opts = {}) {
  const license = opts.license ?? 'B';
  const strings = Object.entries(rec).filter(([, v]) => typeof v === 'string');
  const html =
    rec.description4 ??
    strings.map(([, v]) => v).find((v) => /<li[\s>]/i.test(v)) ??
    '';
  if (!html) return null;

  // Question text: title2 (or any title-like field), with "0001." numbering stripped.
  const rawTitle = rec.title2 ?? rec.title ?? strings.find(([k]) => /title|question/i.test(k))?.[1] ?? '';
  let title = stripHtml(rawTitle);
  let num = null;
  const m = title.match(/^\s*(\d{1,5})\s*[.)\-]\s*/);
  if (m) {
    num = +m[1];
    title = title.slice(m[0].length);
  }
  if (!title) return null;

  // Answers: <li> items. The correct one carries id="correctAnswerNNNN".
  const answers = [];
  let correct = -1;
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let li;
  while ((li = liRe.exec(html))) {
    if (/correctAnswer/i.test(li[1]) || /correctAnswer/i.test(li[0])) correct = answers.length;
    const t = stripHtml(li[1]);
    if (t) answers.push(t);
  }
  if (answers.length < 2 || correct < 0 || correct >= answers.length) return null;

  // License categories appear as «B» «C1» ... buttons. If none listed, assume all.
  const allText = strings.map(([, v]) => v).join(' ');
  const lic = [...allText.matchAll(/«\s*([A-Z0-9]{1,3})\s*»/g)].map((x) => x[1]);
  if (lic.length && license && !lic.includes(license)) return null;

  const imgM = allText.match(/<img[^>]+src\s*=\s*["']([^"']+)["']/i);
  let img = imgM ? decode(imgM[1]) : null;
  if (img && img.startsWith('//')) img = 'https:' + img;
  if (img && img.startsWith('/')) img = 'https://www.gov.il' + img;

  const id = 'g' + (num ?? rec._id ?? hash(title));
  return { id, n: num, q: title, a: answers, c: correct, img, t: topicKey(rec.category ?? '') };
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function parseRecords(records, opts) {
  const seen = new Set();
  const out = [];
  for (const r of records) {
    const q = parseRecord(r, opts);
    if (!q || seen.has(q.id)) continue;
    seen.add(q.id);
    out.push(q);
  }
  return out;
}

export const DATAGOV = {
  base: 'https://data.gov.il/api/3/action',
  // Known resource id of the theory-question bank; the build script also
  // searches the catalogue in case it changes.
  resourceIds: ['bf7cb748-f220-474b-a4d5-2d59f93db28d'],
  headers: { 'User-Agent': 'datagov-external-client', Accept: 'application/json' },
};

/** Fetch all records of a datastore resource (paged). fetchImpl = fetch */
export async function fetchResource(resourceId, fetchImpl = fetch, log = () => {}) {
  const all = [];
  let offset = 0;
  const limit = 1000;
  for (;;) {
    const url = `${DATAGOV.base}/datastore_search?resource_id=${resourceId}&limit=${limit}&offset=${offset}`;
    const res = await fetchImpl(url, { headers: DATAGOV.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const j = await res.json();
    if (!j.success) throw new Error('CKAN error: ' + JSON.stringify(j.error));
    const recs = j.result.records ?? [];
    all.push(...recs);
    log(`fetched ${all.length}/${j.result.total}`);
    offset += limit;
    if (!recs.length || all.length >= (j.result.total ?? 0)) break;
  }
  return all;
}
