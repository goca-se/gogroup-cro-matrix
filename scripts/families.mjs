// Agrupa testes em "famílias": a mesma tese testada em marcas diferentes.
// O Elevate não expõe agrupamento, então derivamos do nome. A ordem importa —
// a primeira regra que casar vence.
export const RULES = [
  [/Pop-?Up|Popup|WhatsApp de grupo/i,                        'Pop-up / captação WhatsApp',        'FEATURE'],
  [/pix/i,                                                    'Desconto no Pix',                   'PREÇO'],
  [/Carrinho (Upcart|Nativo)/i,                               'Tipo de carrinho (Upcart/GoCart+)', 'CARRINHO'],
  [/Fase \d|Kokeshi (Novo Tema|Rebrand)/i,                     'Virada de tema Kokeshi',            'TEMA'],
  [/Tema Gogroup|Gogroup-Theme|novo tema global|Estrutura de Tema novo|Teste Elevate/i,
                                                              'Virada de tema Gogroup',            'TEMA'],
  [/Videowise|Widde/i,                                        'Vídeos UGC na PDP',                 'PDP'],
  [/Card de [Pp]roduto/i,                                     'Card de produto refatorado',        'TEMA'],
  [/Collection Slider/i,                                      'Collection slider na home',         'HOME'],
  [/1st fold|1º fold|Collection Page Enriquecida/i,            'Collection 1st fold enriquecido',   'COLEÇÃO'],
  [/\bIOS\b|\biOS\b/,                                         'Toggle iOS de seletor/upsell',      'PDP'],
  [/upsel/i,                                                  'Upsell na PDP',                     'PDP'],
  [/Enriquecida|Incrementada|Incremento de Conteúdo|conteúdo incrementado|Novo design PDP|Simplificada/i,
                                                              'PDP enriquecida',                   'PDP'],
  [/Hero slider/i,                                            'Hero slider layout',                'HOME'],
  [/Trust Icons/i,                                            'Trust icons na home',               'HOME'],
  [/carros?sel|Vitrine (Grid|vs)/i,                            'Vitrine: grid vs. carrossel',       'HOME'],
  [/Seletor de (Linha|Tipo)/i,                                'Seletor de linha em destaque',      'HOME'],
  [/\[Imagens?\]|Imagem de Produto/i,                          'Imagem de produto',                 'IMAGEM'],
  [/Selo dinâmico|Selos? de prova social|prova social|urgência/i,
                                                              'Prova social / urgência',           'PDP'],
  [/Product Card.*Review|Review.*Product Card/i,              'Reviews no card de produto',        'COLEÇÃO'],
  [/Review|Judge\.me/i,                                       'Reviews na PDP',                    'PDP'],
  [/Announcement Bar/i,                                       'Banner na announcement bar',        'TEMA'],
  [/ABC de credibilidade|Compare at price|Formatação de preço/i,
                                                              'Credibilidade do desconto (ABC)',   'PREÇO'],
  [/preço (parcelado|cheio)|Informações de Preço/i,            'Preço parcelado vs. cheio',         'PREÇO'],
  [/cupom/i,                                                  'Mensagem de cupom no carrinho',     'CARRINHO'],
  [/continu(e|ar) comprando/i,                                'Remover "continuar comprando"',     'CARRINHO'],
  [/inspira/i,                                                'Fragrância "inspirado em"',         'TEMA'],

  // GoJump — testes nomeados em inglês. Duas armadilhas aqui: as lojas são regionais, então o
  // sufixo de mercado no nome ("… AU") é a mesma tese em outro país e não pode virar família
  // própria; e o `type` THEME sequestra a área de testes que são claramente de home.
  [/Redesign for Pottd/i,                                     'Redesign de tema POTTD',            'TEMA'],
  [/'?Shop'? button on the homepage/i,                        'Botão "Shop" na home',              'HOME'],
  [/Add to Cart on the Homepage/i,                            'Add to cart na home',               'HOME'],
  [/Yarn Selector/i,                                          'Seletor de fio na PDP',             'PDP'],
  [/Main image/i,                                             'Imagem principal do produto',       'IMAGEM'],
];

const AREA_BY_TYPE = { PRODUCT_IMAGE: 'IMAGEM', THEME: 'TEMA', PRICE_PLUS: 'PREÇO', CONTENT: 'PDP' };
const AREA_BY_TAG = {
  '[cart]': 'CARRINHO', '[pdp]': 'PDP', '[home]': 'HOME', '[collection]': 'COLEÇÃO',
  '[tema]': 'TEMA', '[theme]': 'TEMA', '[feat]': 'FEATURE', '[preço]': 'PREÇO', '[imagem]': 'IMAGEM',
  '[site]': 'COLEÇÃO', '[cart ]': 'CARRINHO',
};

const AREA_BY_WORD = [
  [/\bPDP\b|página de produto|produto/i, 'PDP'],
  [/collection|coleção|\bPLP\b|vitrine/i, 'COLEÇÃO'],
  [/carrinho|\bcart\b|checkout/i,        'CARRINHO'],
  [/\bhome\b|hero|homepage/i,            'HOME'],
  [/tema|theme/i,                        'TEMA'],
  [/preço|desconto|pix|parcelad/i,        'PREÇO'],
  [/imagem|imagens|foto/i,               'IMAGEM'],
];

// Uma tag explícita no título ganha de tudo: [PDP], [Cart], [Home]...
const areaByTag = (name) => {
  const lower = name.trim().toLowerCase();
  for (const [tag, area] of Object.entries(AREA_BY_TAG)) if (lower.includes(tag)) return area;
  return null;
};

const areaByRules = (name) => {
  for (const [re, family, area] of RULES) if (re.test(name)) return area;
  return null;
};

const areaFallback = (name, type) =>
  AREA_BY_TYPE[type] ?? AREA_BY_WORD.find(([re]) => re.test(name))?.[1] ?? 'OUTRO';

export function areaOf(name, type) {
  return areaByTag(name) ?? areaByRules(name) ?? areaFallback(name, type);
}

// Devolve { family, area }. Testes que não casam com nenhuma regra viram família própria,
// com o nome limpo do prefixo entre colchetes.
export function classify(name, type) {
  for (const [re, family, area] of RULES) if (re.test(name)) return { family, area };
  // RULES já não bateu no loop acima, então pula direto para tag/tipo/palavra em vez de
  // repetir a varredura de RULES que areaOf() faria.
  return {
    family: name.trim().replace(/^\[[^\]]+\]\s*/, ''),
    area: areaByTag(name) ?? areaFallback(name, type),
  };
}
