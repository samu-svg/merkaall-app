import type { Promocao } from '@/lib/types';

export const LOJA_PADRAO = 'Mercado Livre';

export type LojaTema = {
  background: string;
  texto: string;
  borda: string;
};

const LOJAS_POR_DOMINIO: { pattern: RegExp; nome: string }[] = [
  { pattern: /mercadolivre|mercadolibre|mlb/i, nome: 'Mercado Livre' },
  { pattern: /amazon/i, nome: 'Amazon' },
  { pattern: /magazineluiza|magalu/i, nome: 'Magazine Luiza' },
  { pattern: /americanas/i, nome: 'Americanas' },
  { pattern: /shopee/i, nome: 'Shopee' },
  { pattern: /aliexpress/i, nome: 'AliExpress' },
  { pattern: /kabum/i, nome: 'KaBuM!' },
  { pattern: /casasbahia/i, nome: 'Casas Bahia' },
];

export const TEMAS_LOJA: Record<string, LojaTema> = {
  'Mercado Livre': {
    background: '#FFE600',
    texto: '#2D3277',
    borda: '#E6CF00',
  },
  Amazon: {
    background: '#FF9900',
    texto: '#131921',
    borda: '#E68A00',
  },
  'Magazine Luiza': {
    background: '#0086FF',
    texto: '#FFFFFF',
    borda: '#0070D4',
  },
  Americanas: {
    background: '#E60014',
    texto: '#FFFFFF',
    borda: '#CC0012',
  },
  Shopee: {
    background: '#EE4D2D',
    texto: '#FFFFFF',
    borda: '#D94428',
  },
  AliExpress: {
    background: '#E62E04',
    texto: '#FFFFFF',
    borda: '#CC2904',
  },
  "KaBuM!": {
    background: '#FF6500',
    texto: '#FFFFFF',
    borda: '#E55A00',
  },
  'Casas Bahia': {
    background: '#003876',
    texto: '#FFFFFF',
    borda: '#002F63',
  },
};

export const TEMA_PADRAO: LojaTema = {
  background: '#F3F4F6',
  texto: '#374151',
  borda: 'rgba(0,0,0,0.08)',
};

export function getLojaNome(promo: Pick<Promocao, 'loja' | 'link_afiliado'>): string {
  const nome = promo.loja?.trim();
  if (nome) return nome;

  const url = (promo.link_afiliado ?? '').toLowerCase();
  if (!url) return LOJA_PADRAO;
  for (const { pattern, nome: loja } of LOJAS_POR_DOMINIO) {
    if (pattern.test(url)) return loja;
  }

  return LOJA_PADRAO;
}

export function getLojaTema(nome: string): LojaTema {
  return TEMAS_LOJA[nome] ?? TEMA_PADRAO;
}

const LOJAS_CTA_MARCA = new Set(['Mercado Livre', 'AliExpress']);

/** Cores do botão "Ver detalhes" para lojas com identidade própria. */
export function getVerDetalhesTema(
  promo: Pick<Promocao, 'loja' | 'link_afiliado'>,
): LojaTema | null {
  const nome = getLojaNome(promo);
  if (!LOJAS_CTA_MARCA.has(nome)) return null;
  return TEMAS_LOJA[nome] ?? null;
}
