import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { STORES, VERTICALS } from './config.mjs';

const read = async (p, fallback) => {
  try { return JSON.parse(await readFile(p, 'utf8')); }
  catch { if (fallback === undefined) throw new Error(`Faltando ${p} — rode "npm run fetch" antes.`);
          return fallback; }
};

const template = await readFile('src/template.html', 'utf8');
const tests    = await read('data/tests.json');
const roadmap  = await read('data/roadmap.json', []);
const updated  = await read('data/updated.json', {});

// Só publicamos lojas que realmente têm teste medido — o resto ficaria como coluna vazia.
const measured = new Set(tests.map(t => t.store));
const stores = STORES.filter(s => measured.has(s.key))
  .map(s => ({ k: s.key, n: s.name, v: s.vertical }));

const html = template
  .replace('__DATA__',     JSON.stringify(tests))
  .replace('__ROADMAP__',  JSON.stringify(roadmap))
  .replace('__STORES__',   JSON.stringify(stores))
  .replace('__VERTS__',    JSON.stringify(VERTICALS.map(v => [v.key, v.name])))
  .replace('__UPDATED__',  JSON.stringify(updated));

if (html.includes('__DATA__')) throw new Error('Placeholder não substituído no template.');

await mkdir('dist', { recursive: true });
await writeFile('dist/index.html', html);

const by = (fn) => tests.reduce((a, t) => (a[fn(t)] = (a[fn(t)] ?? 0) + 1, a), {});
console.log(`dist/index.html — ${(html.length / 1024).toFixed(0)} KB`);
console.log(`  ${tests.length} testes em ${stores.length} lojas:`, by(t => t.cls));
console.log(`  ${roadmap.length} itens de roadmap`);
