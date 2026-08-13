import { writeFile, mkdir } from 'node:fs/promises';
import { STORES, tokenFor, SIGNIFICANCE } from './config.mjs';
import { call, listTests, pool } from './elevate.mjs';
import { classify } from './families.mjs';

const round = (v, d = 2) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);

function shape(store, test, results, sig) {
  const variations = results?.variations ?? [];
  const control = variations.find(v => v.isControl) ?? variations[0] ?? null;
  const others  = variations.filter(v => !v.isControl);
  // Em testes A/B/C, comparamos a variação de maior RPV contra o controle.
  const best = others.length
    ? others.reduce((a, b) => ((b.revenuePerVisitor ?? 0) > (a.revenuePerVisitor ?? 0) ? b : a))
    : null;

  const prob = Object.fromEntries(
    (sig?.results?.REVENUE_PER_VISITOR ?? []).map(x => [String(x.variant), x.percentage]));
  const pBest = best    ? prob[String(best.variationId)]    ?? null : null;
  const pCtrl = control ? prob[String(control.variationId)] ?? null : null;

  let cls;
  if (test.status === 'Running')      cls = 'running';
  else if (test.status === 'Paused')  cls = 'paused';
  else if (pBest != null && pBest >= SIGNIFICANCE) cls = 'winner';
  else if (pCtrl != null && pCtrl >= SIGNIFICANCE) cls = 'control';
  else cls = 'inconclusive';

  const lift = (k) => {
    if (!control || !best) return null;
    const c = control[k], b = best[k];
    return (c == null || c === 0 || b == null) ? null : round((b - c) / c * 100);
  };
  const { family, area } = classify(test.name, test.type);

  return {
    store, name: test.name.trim(), family, area, type: test.type, status: test.status, cls,
    goal: test.goal, start: test.startingAt, end: test.completedAt, nvar: variations.length,
    sigStatus: sig?.statisticalStatus ?? null, pBest, pCtrl,
    ctrlName: control?.variationName ?? null, varName: best?.variationName ?? null,
    visitors: variations.reduce((a, v) => a + (v.uniqueVisitors ?? 0), 0),
    visC: control?.uniqueVisitors ?? null, visV: best?.uniqueVisitors ?? null,
    incr: control && best
      ? round(((best.revenuePerVisitor ?? 0) - (control.revenuePerVisitor ?? 0)) * (best.uniqueVisitors ?? 0))
      : null,
    revenue: variations.reduce((a, v) => a + (v.totalRevenue ?? 0), 0),
    crC: control?.conversionRate ?? null,     crV: best?.conversionRate ?? null,     crL: lift('conversionRate'),
    rpvC: control?.revenuePerVisitor ?? null, rpvV: best?.revenuePerVisitor ?? null, rpvL: lift('revenuePerVisitor'),
    aovC: control?.averageOrderValue ?? null, aovV: best?.averageOrderValue ?? null, aovL: lift('averageOrderValue'),
    atcC: control?.addToCartRate ?? null,     atcV: best?.addToCartRate ?? null,     atcL: lift('addToCartRate'),
  };
}

const active = STORES.filter(s => tokenFor(s.key));
const missing = STORES.filter(s => !tokenFor(s.key)).map(s => s.key);
if (!active.length) {
  console.error('Nenhum token do Elevate no ambiente. Defina ELEVATE_<LOJA> (ex.: ELEVATE_APICE).');
  process.exit(1);
}
if (missing.length) console.warn(`Sem token, pulando: ${missing.join(', ')}`);

const all = [];
for (const store of active) {
  const token = tokenFor(store.key);
  const tests = await listTests(token);
  const rows = await pool(tests, 6, async (t) => {
    const [results, sig] = await Promise.all([
      call(token, 'get_test_results', { testId: t.testId }).catch(() => null),
      call(token, 'get_statistical_significance', { testId: t.testId }).catch(() => null),
    ]);
    return shape(store.key, t, results, sig);
  });
  all.push(...rows);
  const noData = rows.filter(r => r.rpvL == null).length;
  console.log(`${store.name.padEnd(10)} ${String(rows.length).padStart(3)} testes` +
              (noData ? `  (${noData} sem dados de variação)` : ''));
}

await mkdir('data', { recursive: true });
await writeFile('data/tests.json', JSON.stringify(all));
await writeFile('data/updated.json', JSON.stringify({
  tests: new Date().toISOString(), stores: active.map(s => s.key),
}));
console.log(`\n${all.length} testes gravados em data/tests.json`);
