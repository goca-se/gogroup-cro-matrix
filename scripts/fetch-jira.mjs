import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { JIRA } from './config.mjs';
import { classify } from './families.mjs';

if (!JIRA.email || !JIRA.token) {
  console.warn('JIRA_EMAIL / JIRA_API_TOKEN ausentes — mantendo data/roadmap.json como está.');
  process.exit(0);
}

const auth = 'Basic ' + Buffer.from(`${JIRA.email}:${JIRA.token}`).toString('base64');

async function search(jql) {
  const out = [];
  let nextPageToken;
  do {
    const res = await fetch(`https://${JIRA.host}/rest/api/3/search/jql`, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        jql: `${jql} ORDER BY created DESC`,
        maxResults: 100,
        fields: ['summary', 'status', 'issuetype', 'created', 'labels', 'description'],
        nextPageToken,
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw new Error(`Jira HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const page = await res.json();
    out.push(...(page.issues ?? []));
    nextPageToken = page.nextPageToken;
  } while (nextPageToken);
  return out;
}

// A descrição vem em ADF (JSON). Achatamos para texto, preservando quebras de bloco.
function adfToText(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(adfToText).join('');
  if (node.type === 'text') return node.text ?? '';
  if (node.type === 'hardBreak') return '\n';
  const inner = adfToText(node.content);
  const block = ['paragraph', 'heading', 'listItem', 'blockquote', 'codeBlock', 'panel'];
  return block.includes(node.type) ? inner + '\n' : inner;
}

const clean = (s, max) => {
  const t = s
    .replace(/\\?\[\s*[xX ]?\s*\\?\]/g, '')          // caixas de checklist "[ ]" / "[x]"
    .replace(/[*_`#]/g, '')
    .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, '')
    .replace(/\s+/g, ' ')
    .trim();
  return t.length > max ? t.slice(0, max - 1).replace(/[\s,;.:]+\S*$/, '') + '…' : t;
};

const HEADING = /^\s*[^\p{L}]*(contexto|objetivo|o que deve ser feito|estado atual|requisitos?[^:]*|crit[ée]rios? de aceite|pend[êe]ncias[^:]*|bloqueios|refer[êe]ncias?[^:]*|tipo de valida[çc][ãa]o|qa com[^:]*|prioridade|m[ée]tricas?[^:]*|hip[óo]tese|estrat[ée]gia|entreg[áa]veis[^:]*|resultado esperado|marcas? impactadas?|sistemas envolvidos|escopo|categoria)\s*:?\s*$/iu;

// Pega o corpo de uma seção do markdown/ADF achatado, até o próximo cabeçalho.
function section(text, ...titles) {
  const lines = text.split('\n');
  for (const title of titles) {
    const i = lines.findIndex(l => new RegExp(`^\\s*(#+\\s*)?[^\\w]*${title}\\b`, 'i').test(l));
    if (i === -1) continue;
    const body = [];
    const heading = new RegExp(`^[^\\w]*${title}\\b`, 'i');
    for (let j = i + 1; j < lines.length; j++) {
      const l = lines[j];
      // Um novo cabeçalho encerra a seção. Precisa da flag `u`: sem ela os emojis
      // (pares surrogados) não casam dentro de classe de caracteres. E o ADF achatado
      // perde o "##", então também cortamos em linhas que são só um título conhecido.
      if (body.length && (/^\s*(#{1,4}\s|\p{Extended_Pictographic}\s*\p{Lu})/u.test(l) || HEADING.test(l))) break;
      const clean_ = l.trim().replace(/^[-*•]\s*/, '');
      // pula repetição do próprio cabeçalho (o ADF costuma duplicar "🎯 Objetivo")
      if (clean_ && !(body.length === 0 && heading.test(clean_.replace(/^[^\p{L}]+/u, '')))) body.push(clean_);
      if (body.join(' ').length > 400) break;
    }
    if (body.length) return body.join(' ');
  }
  return '';
}

const ACCENT = { Apice: 'Ápice', Ápice: 'Ápice', Rituaria: 'Rituária', 'Rituária': 'Rituária',
  Barbours: "Barbour's", "Barbour's": "Barbour's", Kokeshi: 'Kokeshi', Lescent: 'Lescent',
  Denavita: 'Denavita', Yenzah: 'Yenzah', 'By Samia': 'By Samia' };

const STATUS = {
  'tarefas pendentes': 'Backlog', backlog: 'Backlog', 'to do': 'Backlog',
  'em andamento': 'Em andamento', 'in progress': 'Em andamento',
  validation: 'Validação', validação: 'Validação',
  'code review': 'Code review',
  'waiting for client': 'Aguardando cliente',
  blocked: 'Bloqueado', bloqueado: 'Bloqueado',
};

function shape(issue, vertical) {
  const summary = issue.fields.summary.trim();
  const text = adfToText(issue.fields.description);
  const tags = [...summary.matchAll(/\[([^\]]+)\]/g)].map(m => m[1].trim());

  let brand = '';
  const ab = summary.match(/\[AB\s+([^\]]+)\]/i);
  if (ab) brand = ACCENT[ab[1].trim()] ?? ab[1].trim();
  else if (vertical === 'jump' && tags.length) {
    const first = tags[0];
    if (!/^A\/B$/i.test(first) && /^[A-ZÀ-Ú0-9 .'-]+$/.test(first)) brand = first;
  }

  const isEpic = /epic|épico/i.test(issue.fields.issuetype?.name ?? '');
  const isAB = /\[A\/B\]|\[AB\s/i.test(summary) || /teste\s+A\/B|implementada como teste A\/B/i.test(text);
  const kind = isEpic ? 'epic' : isAB ? 'ab' : 'prod';

  // Título sem os prefixos entre colchetes — marca e área já viram chip.
  const title = summary.replace(/^(\s*\[[^\]]*\]\s*)+/, '').trim() || summary;

  const { family, area } = classify(summary.replace(/\[AB\s+[^\]]+\]\s*/i, ''),
                                    issue.fields.issuetype?.name ?? '');
  const known = FAMILIES.has(family) ? family : null;

  const statusRaw = issue.fields.status?.name ?? '';
  return {
    key: issue.key,
    vert: vertical,
    brand,
    title: isEpic && !/épico|epic/i.test(title) ? `${title} (épico)` : title,
    area,
    status: STATUS[statusRaw.toLowerCase()] ?? statusRaw,
    kind,
    created: issue.fields.created?.slice(0, 10) ?? null,
    fam: known,
    note: clean(section(text, 'Objetivo', 'Contexto', 'O que deve ser feito'), 260) || null,
    blocked: clean(section(text, 'Pendências e Bloqueios', 'Pendências', 'Bloqueios'), 240) || null,
    url: `https://${JIRA.host}/browse/${issue.key}`,
  };
}

// Famílias que existem de fato nos testes já rodados — só ligamos o "já testado" quando há histórico.
const tests = JSON.parse(await readFile('data/tests.json', 'utf8').catch(() => '[]'));
const FAMILIES = new Set(tests.map(t => t.family));

// Épicos e tarefas sem colchete guardam a marca no meio do título ("Evoluções WAK").
// Depois de conhecer as marcas da vertical, preenchemos as que ficaram em branco.
function backfillBrands(rows) {
  const known = [...new Set(rows.map(r => r.brand).filter(Boolean))]
    .sort((a, b) => b.length - a.length);
  for (const r of rows) {
    if (r.brand) continue;
    const hit = known.find(b => new RegExp(`\\b${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(r.title));
    if (hit) r.brand = hit;
  }
  return rows;
}

const roadmap = [];
for (const src of JIRA.sources) {
  const issues = await search(src.jql);
  const rows = backfillBrands(issues.map(i => shape(i, src.vertical)));
  roadmap.push(...rows);
  console.log(`${src.vertical.padEnd(7)} ${String(rows.length).padStart(3)} itens ` +
              `(${rows.filter(r => r.kind === 'ab').length} testes A/B)`);
}

await mkdir('data', { recursive: true });
await writeFile('data/roadmap.json', JSON.stringify(roadmap));
const stamp = JSON.parse(await readFile('data/updated.json', 'utf8').catch(() => '{}'));
await writeFile('data/updated.json', JSON.stringify({ ...stamp, roadmap: new Date().toISOString() }));
console.log(`\n${roadmap.length} itens gravados em data/roadmap.json`);
