import { ELEVATE_URL } from './config.mjs';

// O Elevate responde JSON-RPC sobre SSE: o payload vem em linhas `data: {...}`.
function parse(raw) {
  for (const line of raw.split('\n')) {
    if (!line.startsWith('data: ')) continue;
    const msg = JSON.parse(line.slice(6));
    if (msg.error) throw new Error(msg.error.message || JSON.stringify(msg.error));
    const text = msg.result?.content?.[0]?.text;
    if (text === undefined) return msg.result ?? null;
    try { return JSON.parse(text); } catch { return text; }
  }
  return JSON.parse(raw);
}

export async function call(token, tool, args = {}, { retries = 3 } = {}) {
  const body = JSON.stringify({
    jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: tool, arguments: args },
  });
  let last;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(ELEVATE_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body,
        signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} em ${tool}`);
      return parse(await res.text());
    } catch (err) {
      last = err;
      if (attempt < retries) await new Promise(r => setTimeout(r, 800 * attempt));
    }
  }
  throw last;
}

export async function listTests(token) {
  const out = [];
  for (let offset = 0; ; offset += 100) {
    const page = await call(token, 'list_tests', { limit: 100, offset });
    if (!Array.isArray(page) || page.length === 0) break;
    out.push(...page);
    if (page.length < 100) break;
  }
  return out;
}

// Roda `jobs` em paralelo com teto de concorrência, para não estourar a API.
export async function pool(items, limit, worker) {
  const out = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await worker(items[i], i);
    }
  }));
  return out;
}
