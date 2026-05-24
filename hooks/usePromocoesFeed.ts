import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { normalizarCategoria } from '@/lib/categorias';
import { handleNewPromo, handlePromoUpdate, seedSeenPromos } from '@/lib/notificationTriggers';
import { buscarPromocoes, getSupabaseClient } from '@/lib/supabase';
import { useSavedStore } from '@/store/useSavedStore';
import {
  CATEGORIA_TODAS,
  PRECO_MAX_PADRAO,
  TODAS_AS_CATEGORIAS,
  type FiltrosAtivos,
  type Promocao,
} from '@/lib/types';

async function posCarregarFeed(data: Promocao[], isFirstLoad: boolean): Promise<void> {
  try {
    await seedSeenPromos(data, isFirstLoad);

    const savedIds = useSavedStore.getState().saved.map((p) => p.id);
    if (savedIds.length === 0) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: alive } = await supabase.from('promocoes').select('id').in('id', savedIds);
    useSavedStore.getState().pruneMissing((alive ?? []).map((p) => p.id));
  } catch (e) {
    console.warn('[usePromocoesFeed] posCarregar:', e);
  }
}

export function usePromocoesFeed(filtros: FiltrosAtivos) {
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aoVivo, setAoVivo] = useState(false);
  const syncFromPromo = useSavedStore((s) => s.syncFromPromo);
  const removeSaved = useSavedStore((s) => s.remove);
  const isFirstLoad = useRef(true);

  const carregar = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    let data: Promocao[] = [];

    try {
      const result = await buscarPromocoes();
      data = result.data;
      setPromocoes(data);
      setError(result.error);
    } catch (e) {
      console.error('[usePromocoesFeed] carregar:', e);
      setError('Não foi possível carregar as promoções. Puxe para atualizar.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }

    const firstLoad = isFirstLoad.current;
    isFirstLoad.current = false;
    void posCarregarFeed(data, firstLoad);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const channel = supabase
      .channel('promocoes-feed-mobile')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'promocoes' }, (payload) => {
        const nova = payload.new as Promocao;
        if (!nova.aprovada) return;
        setPromocoes((prev) => (prev.some((p) => p.id === nova.id) ? prev : [nova, ...prev]));
        void handleNewPromo(nova);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'promocoes' }, (payload) => {
        const atualizada = payload.new as Promocao;
        const anterior = payload.old as Promocao | undefined;
        if (!atualizada.aprovada) removeSaved(atualizada.id);
        else syncFromPromo(atualizada);
        setPromocoes((prev) => {
          const prevItem = prev.find((p) => p.id === atualizada.id);
          void handlePromoUpdate(prevItem ?? anterior, atualizada);
          return atualizada.aprovada
            ? prev.map((p) => (p.id === atualizada.id ? atualizada : p))
            : prev.filter((p) => p.id !== atualizada.id);
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'promocoes' }, (payload) => {
        const removida = payload.old as Promocao;
        removeSaved(removida.id);
        setPromocoes((prev) => prev.filter((p) => p.id !== removida.id));
      })
      .subscribe((status) => setAoVivo(status === 'SUBSCRIBED'));

    return () => { void supabase.removeChannel(channel); };
  }, [syncFromPromo, removeSaved]);

  const contagemPorCategoria = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of TODAS_AS_CATEGORIAS) counts[cat] = 0;
    for (const p of promocoes) {
      const cat = normalizarCategoria(p.categoria);
      if (cat) counts[cat] += 1;
    }
    return counts;
  }, [promocoes]);

  const filtradas = useMemo(() => {
    let lista = [...promocoes];

    const catsAtivas =
      filtros.categorias.length > 0
        ? filtros.categorias
        : filtros.categoria !== CATEGORIA_TODAS
          ? [filtros.categoria]
          : [];
    if (catsAtivas.length > 0) {
      lista = lista.filter((p) => {
        const cat = normalizarCategoria(p.categoria);
        return cat != null && catsAtivas.includes(cat);
      });
    }

    if (filtros.freteGratis) {
      lista = lista.filter((p) => p.frete_gratis === true);
    }
    if (filtros.descontoMinimo > 0) {
      lista = lista.filter((p) => p.percentual_desconto >= filtros.descontoMinimo);
    }
    if (filtros.precoMin > 0) {
      lista = lista.filter((p) => p.preco_desconto >= filtros.precoMin);
    }
    if (filtros.precoMax < PRECO_MAX_PADRAO) {
      lista = lista.filter((p) => p.preco_desconto <= filtros.precoMax);
    }
    switch (filtros.ordenacao) {
      case 'desconto':
        lista.sort((a, b) => b.percentual_desconto - a.percentual_desconto);
        break;
      case 'preco':
        lista.sort((a, b) => a.preco_desconto - b.preco_desconto);
        break;
      case 'avaliacao':
        lista.sort((a, b) => (b.avaliacao ?? 0) - (a.avaliacao ?? 0));
        break;
      case 'recente':
        lista.sort((a, b) => new Date(b.criada_em).getTime() - new Date(a.criada_em).getTime());
        break;
    }
    return lista;
  }, [promocoes, filtros]);

  const maiorDesconto = useMemo(() =>
    promocoes.length > 0 ? Math.max(...promocoes.map((p) => p.percentual_desconto)) : 0,
    [promocoes],
  );

  const menorPreco = useMemo(() =>
    promocoes.length > 0 ? Math.min(...promocoes.map((p) => p.preco_desconto)) : 0,
    [promocoes],
  );

  return {
    promocoes: filtradas,
    total: promocoes.length,
    destaques: promocoes.slice(0, 5),
    maiorDesconto,
    menorPreco,
    contagemPorCategoria,
    loading,
    refreshing,
    error,
    aoVivo,
    refresh: () => carregar(true),
  };
}
