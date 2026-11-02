// Build step: download the official theory-question bank from data.gov.il,
// keep license-B questions, download their images for offline use, and write
// www/data/questions.json. If anything fails the app falls back to the
// built-in practice set (www/data/fallback.json), so the build never breaks.
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRecords, fetchResource, DATAGOV } from '../www/js/gov-parser.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'www');
const BROWSER_UA =
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';
const log = (...a) => console.log('[questions]', ...a);

async function findResourceIds() {
  const ids = [...DATAGOV.resourceIds];
  for (const q of ['theory', 'תאוריה', 'תיאוריה', 'שאלות תאוריה']) {
    try {
      const r = await fetch(`${DATAGOV.base}/package_search?q=${encodeURIComponent(q)}&rows=20`, {
        headers: DATAGOV.headers,
      });
      const j = await r.json();
      for (const p of j.result?.results ?? []) {
        for (const res of p.resources ?? []) {
          if (res.datastore_active && !ids.includes(res.id)) {
            log(`candidate: ${p.title} / ${res.name} -> ${res.id}`);
            ids.push(res.id);
          }
        }
      }
    } catch (e) {
      log('package_search failed:', e.message);
    }
  }
  return ids;
}

async function downloadImages(questions) {
  const dir = join(root, 'img', 'q');
  await mkdir(dir, { recursive: true });
  const todo = questions.filter((q) => q.img && /^https?:/.test(q.img));
  let ok = 0;
  let fail = 0;
  const queue = [...todo];
  async function worker() {
    for (let q; (q = queue.shift()); ) {
      const name = q.img.split('/').pop().split('?')[0].replace(/[^\w.\-]/g, '_');
      try {
        const r = await fetch(q.img, { headers: { 'User-Agent': BROWSER_UA } });
        const type = r.headers.get('content-type') ?? '';
        if (!r.ok || !type.startsWith('image/')) throw new Error(`${r.status} ${type}`);
        await writeFile(join(dir, name), Buffer.from(await r.arrayBuffer()));
        q.imgRemote = q.img;
        q.img = `img/q/${name}`;
        ok++;
      } catch (e) {
        fail++;
        if (fail <= 5) log('image failed', q.img, e.message);
      }
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
  log(`images: ${ok} downloaded, ${fail} failed (failed ones load online)`);
}

async function main() {
  const ids = await findResourceIds();
  for (const id of ids) {
    try {
      log('trying resource', id);
      const recs = await fetchResource(id, fetch, log);
      if (recs[0]) log('sample record:', JSON.stringify(recs[0]).slice(0, 1500));
      const questions = parseRecords(recs, { license: 'B' });
      const byTopic = questions.reduce((m, q) => ((m[q.t] = (m[q.t] ?? 0) + 1), m), {});
      log(`parsed ${questions.length} license-B questions from ${recs.length} records`, byTopic);
      if (questions.length < 300) continue;
      await downloadImages(questions);
      const out = {
        source: 'משרד התחבורה – מאגר שאלות התאוריה (data.gov.il)',
        official: true,
        generatedAt: new Date().toISOString(),
        questions,
      };
      await writeFile(join(root, 'data', 'questions.json'), JSON.stringify(out));
      log('wrote www/data/questions.json');
      return;
    } catch (e) {
      log('resource failed:', e.message);
    }
  }
  log('WARNING: official bank unavailable, the app will use the built-in practice set.');
}

main().catch((e) => {
  log('fatal (ignored):', e);
});
