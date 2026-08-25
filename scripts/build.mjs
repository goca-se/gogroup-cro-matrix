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
  .map(s => ({ k: s.key, n: s.name, v: s.vertical, c: s.currency }));

// Escapa `<` para não deixar um `</script>` vindo de um nome de teste/nota do Jira fechar a tag
// de dados prematuramente — `<` nunca aparece de outra forma num JSON válido, e o navegador
// devolve `<` para `<` de volta antes do JSON.parse, então isso não muda o valor lido em runtime.
const toScript = (v) => JSON.stringify(v).replace(/</g, '\\u003c');

const html = template
  .replace('__DATA__',     toScript(tests))
  .replace('__ROADMAP__',  toScript(roadmap))
  .replace('__STORES__',   toScript(stores))
  .replace('__VERTS__',    toScript(VERTICALS.map(v => [v.key, v.name])))
  .replace('__UPDATED__',  toScript(updated));

for (const ph of ['__DATA__', '__ROADMAP__', '__STORES__', '__VERTS__', '__UPDATED__']) {
  if (html.includes(ph)) throw new Error(`Placeholder ${ph} não substituído no template.`);
}

await mkdir('dist', { recursive: true });
await writeFile('dist/index.html', html);

const by = (fn) => tests.reduce((a, t) => (a[fn(t)] = (a[fn(t)] ?? 0) + 1, a), {});
console.log(`dist/index.html — ${(html.length / 1024).toFixed(0)} KB`);
console.log(`  ${tests.length} testes em ${stores.length} lojas:`, by(t => t.cls));
console.log(`  ${roadmap.length} itens de roadmap`);
