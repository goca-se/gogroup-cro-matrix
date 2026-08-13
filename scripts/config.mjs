// Lojas medidas no Elevate. Cada uma precisa de um token `ELEVATE_<KEY>` no ambiente.
// Para ligar uma loja nova (ex.: GoJump), basta acrescentar a linha aqui e o secret correspondente.
export const STORES = [
  { key: 'apice',    name: 'Ápice',     vertical: 'beaute' },
  { key: 'barbours', name: "Barbour's", vertical: 'beaute' },
  { key: 'kokeshi',  name: 'Kokeshi',   vertical: 'beaute' },
  { key: 'rituaria', name: 'Rituária',  vertical: 'beaute' },
  { key: 'lescent',  name: 'Lescent',   vertical: 'beaute' },
  // { key: 'pottd',  name: 'POTTD', vertical: 'jump' },
  // { key: 'wak',    name: 'WAK',   vertical: 'jump' },
];

export const VERTICALS = [
  { key: 'beaute', name: 'Gobeaute' },
  { key: 'jump',   name: 'GoJump' },
];

export const ELEVATE_URL = process.env.ELEVATE_URL || 'https://elevateab.app/api/mcp';

// Token da loja: ELEVATE_APICE, ELEVATE_BARBOURS, ...
export const tokenFor = (key) => process.env[`ELEVATE_${key.toUpperCase()}`];

// Jira — usado só para o roadmap. Sem credencial, o roadmap anterior é preservado.
export const JIRA = {
  host:  process.env.JIRA_HOST  || 'goengenharia.atlassian.net',
  email: process.env.JIRA_EMAIL,
  token: process.env.JIRA_API_TOKEN,
  // Onde procurar testes planejados, por vertical.
  sources: [
    { vertical: 'beaute', jql: 'project = GS AND summary ~ "AB" AND statusCategory != Done' },
    { vertical: 'jump',   jql: 'project = JUMP AND statusCategory != Done' },
  ],
};

// Corte de significância: probabilidade mínima de ser a melhor variação, em RPV.
export const SIGNIFICANCE = Number(process.env.SIGNIFICANCE ?? 95);
