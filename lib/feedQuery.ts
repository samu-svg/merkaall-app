import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

import { DESCONTO_PERCENTUAL_MAX_CONFIAVEL, isDescontoSuspeito } from './promoFormat';
import {
  CATEGORIA_TODAS,
  LOJA_TODAS,
  PRECO_MAX_PADRAO,
  type FiltrosAtivos,
  type Promocao,
} from './types';

export const FEED_PAGE_SIZE = 40;

export type FiltrosFeed = Pick<
  FiltrosAtivos,
  | 'loja'
  | 'categoria'
  | 'categorias'
  | 'freteGratis'
  | 'descontoMaximo'
  | 'precoMin'
  | 'precoMax'
  | 'ordenacao'
>;

function categoriasAtivas(filtros: FiltrosFeed): string[] {
  if (filtros.categorias.length > 0) return filtros.categorias;
  if (filtros.categoria !== CATEGORIA_TODAS) return [filtros.categoria];
  return [];
}

export function applyFiltrosFeed<T>(
  query: PostgrestFilterBuilder<any, any, any, T>,
  filtros: FiltrosFeed,
) {
  let q = query
    .eq('aprovada', true)
    .lt('percentual_desconto', DESCONTO_PERCENTUAL_MAX_CONFIAVEL);

  if (filtros.loja && filtros.loja !== LOJA_TODAS) {
    q = q.eq('loja', filtros.loja);
  }

  const cats = categoriasAtivas(filtros);
  if (cats.length === 1) q = q.eq('categoria', cats[0]);
  else if (cats.length > 1) q = q.in('categoria', cats);

  if (filtros.freteGratis) q = q.eq('frete_gratis', true);
  if (filtros.descontoMaximo > 0) q = q.lte('percentual_desconto', filtros.descontoMaximo);
  if (filtros.precoMin > 0) q = q.gte('preco_desconto', filtros.precoMin);
  if (filtros.precoMax < PRECO_MAX_PADRAO) q = q.lte('preco_desconto', filtros.precoMax);

  switch (filtros.ordenacao) {
    case 'preco':
      return q.order('preco_desconto', { ascending: true });
    case 'avaliacao':
      return q.order('avaliacao', { ascending: false, nullsFirst: false });
    case 'recente':
      return q.order('criada_em', { ascending: false });
    case 'desconto':
    default:
      return q.order('percentual_desconto', { ascending: false });
  }
}

export function promocaoMatchesFiltros(promo: Promocao, filtros: FiltrosFeed): boolean {
  if (!promo.aprovada || isDescontoSuspeito(promo)) return false;

  if (filtros.loja && filtros.loja !== LOJA_TODAS && promo.loja !== filtros.loja) {
    return false;
  }

  const cats = categoriasAtivas(filtros);
  if (cats.length > 0 && (!promo.categoria || !cats.includes(promo.categoria))) {
    return false;
  }

  if (filtros.freteGratis && !promo.frete_gratis) return false;
  if (filtros.descontoMaximo > 0 && promo.percentual_desconto > filtros.descontoMaximo) {
    return false;
  }
  if (filtros.precoMin > 0 && promo.preco_desconto < filtros.precoMin) return false;
  if (filtros.precoMax < PRECO_MAX_PADRAO && promo.preco_desconto > filtros.precoMax) {
    return false;
  }

  return true;
}
