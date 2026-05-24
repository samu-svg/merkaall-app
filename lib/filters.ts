import {
  DESCONTO_MAX_PADRAO,
  FILTROS_PADRAO,
  PRECO_MAX_PADRAO,
  PRECO_MIN_PADRAO,
  type FiltrosAtivos,
} from '@/lib/types';

export { DESCONTO_MAX_PADRAO, PRECO_MAX_PADRAO, PRECO_MIN_PADRAO };

export function hasFiltrosModalAtivos(filtros: FiltrosAtivos): boolean {
  return (
    filtros.precoMin > PRECO_MIN_PADRAO ||
    filtros.precoMax < PRECO_MAX_PADRAO ||
    filtros.descontoMinimo > 0 ||
    filtros.categorias.length > 0
  );
}

export function limparFiltrosModal(filtros: FiltrosAtivos): FiltrosAtivos {
  return {
    ...filtros,
    precoMin: PRECO_MIN_PADRAO,
    precoMax: PRECO_MAX_PADRAO,
    descontoMinimo: 0,
    categorias: [],
  };
}

export function resetFiltrosModal(): Pick<
  FiltrosAtivos,
  'precoMin' | 'precoMax' | 'descontoMinimo' | 'categorias'
> {
  return {
    precoMin: FILTROS_PADRAO.precoMin,
    precoMax: FILTROS_PADRAO.precoMax,
    descontoMinimo: FILTROS_PADRAO.descontoMinimo,
    categorias: FILTROS_PADRAO.categorias,
  };
}
