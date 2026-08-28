// Lojas medidas no Elevate. Cada uma precisa de um token `ELEVATE_<KEY>` no ambiente.
// Para ligar uma loja nova, basta acrescentar a linha aqui e o secret correspondente.
// `currency` é a moeda em que a loja fatura — o fetch confere contra o Elevate e avisa se divergir.
// Valores em dinheiro nunca são somados entre moedas: veja MONEY em src/template.html.
export const STORES = [
  { key: 'apice',    name: 'Ápice',     vertical: 'beaute', currency: 'BRL' },
  { key: 'barbours', name: "Barbour's", vertical: 'beaute', currency: 'BRL' },
  { key: 'kokeshi',  name: 'Kokeshi',   vertical: 'beaute', currency: 'BRL' },
  { key: 'rituaria', name: 'Rituária',  vertical: 'beaute', currency: 'BRL' },
  { key: 'lescent',  name: 'Lescent',   vertical: 'beaute', currency: 'BRL' },
  { key: 'denavita', name: 'Denavita',  vertical: 'beaute', currency: 'BRL' },
  // GoJump: uma instância do Elevate por região, logo uma loja aqui por região.
  { key: 'wak_us',   name: 'WAK USA',   vertical: 'jump',   currency: 'USD' },
  { key: 'pottd_eu', name: 'POTTD EU',  vertical: 'jump',   currency: 'EUR' },
  { key: 'pottd_uk', name: 'POTTD UK',  vertical: 'jump',   currency: 'GBP' },
  { key: 'pottd_au', name: 'POTTD AU',  vertical: 'jump',   currency: 'AUD' },
  { key: 'loc',      name: 'Life of Colour', vertical: 'jump', currency: 'AUD' },
  // { key: 'wak_eu', name: 'WAK EU', vertical: 'jump', currency: 'EUR' },  // sem token válido ainda
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
