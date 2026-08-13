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
  [/Videowise/i,                                              'Videowise (vídeos UGC)',            'PDP'],
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
  [/Selo|prova social|urgência/i,                             'Prova social / urgência',           'PDP'],
  [/Review|Judge\.me/i,                                       'Reviews na PDP',                    'PDP'],
  [/Announcement Bar/i,                                       'Banner na announcement bar',        'TEMA'],
  [/ABC de credibilidade|Compare at price|Formatação de preço/i,
                                                              'Credibilidade do desconto (ABC)',   'PREÇO'],
  [/preço (parcelado|cheio)|Informações de Preço/i,            'Preço parcelado vs. cheio',         'PREÇO'],
  [/cupom/i,                                                  'Mensagem de cupom no carrinho',     'CARRINHO'],
  [/continu(e|ar) comprando/i,                                'Remover "continuar comprando"',     'CARRINHO'],
  [/inspira/i,                                                'Fragrância "inspirado em"',         'TEMA'],
];

const AREA_BY_TYPE = { PRODUCT_IMAGE: 'IMAGEM', THEME: 'TEMA', PRICE_PLUS: 'PREÇO', CONTENT: 'PDP' };
const AREA_BY_TAG = {
  '[cart]': 'CARRINHO', '[pdp]': 'PDP', '[home]': 'HOME', '[collection]': 'COLEÇÃO',
  '[tema]': 'TEMA', '[theme]': 'TEMA', '[feat]': 'FEATURE', '[preço]': 'PREÇO', '[imagem]': 'IMAGEM',
  '[site]': 'COLEÇÃO', '[cart ]': 'CARRINHO',
};

export function areaOf(name, type) {
  const lower = name.trim().toLowerCase();
  for (const [tag, area] of Object.entries(AREA_BY_TAG)) if (lower.startsWith(tag)) return area;
  return AREA_BY_TYPE[type] ?? 'OUTRO';
}

// Devolve { family, area }. Testes que não casam com nenhuma regra viram família própria,
// com o nome limpo do prefixo entre colchetes.
export function classify(name, type) {
  for (const [re, family, area] of RULES) if (re.test(name)) return { family, area };
  return { family: name.trim().replace(/^\[[^\]]+\]\s*/, ''), area: areaOf(name, type) };
}
