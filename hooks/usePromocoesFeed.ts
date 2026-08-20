import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { loadFeedCache, saveFeedCache } from '@/lib/feedCache';
import { promocaoMatchesFiltros } from '@/lib/feedQuery';
import { normalizePromocao } from '@/lib/promoFormat';
import { handleNewPromo, handlePromoUpdate, seedSeenPromos } from '@/lib/notificationTriggers';
import {
  buscarDestaques,
  buscarPromocoesPagina,
  contarPromocoes,
  FEED_PAGE_SIZE,
  getSupabaseClient,
} from '@/lib/supabase';
import { useSavedStore } from '@/store/useSavedStore';
import { useFeedPrefsStore } from '@/store/useFeedPrefsStore';
import { type FiltrosAtivos, type Promocao } from '@/lib/types';

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
  const [destaques, setDestaques] = useState<Promocao[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aoVivo, setAoVivo] = useState(false);
  const syncFromPromo = useSavedStore((s) => s.syncFromPromo);
  const removeSaved = useSavedStore((s) => s.remove);
  const isFirstLoad = useRef(true);
  const pageRef = useRef(0);
  const filtrosRef = useRef(filtros);
  filtrosRef.current = filtros;

  const filtrosKey = useMemo(() => JSON.stringify(filtros), [filtros]);

  const realtimeChannelId = useMemo(
    () => `promocoes-feed-${filtrosKey.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 96)}`,
    [filtrosKey],
  );

  const hidratarCache = useCallback(async () => {
    const cached = await loadFeedCache();
    if (!cached) return false;

    setPromocoes((prev) => (prev.length === 0 ? cached.promocoes : prev));
    setDestaques((prev) => (prev.length === 0 ? cached.destaques : prev));
    setTotal((prev) => (prev === 0 ? cached.total : prev));
    return cached.promocoes.length > 0 || cached.destaques.length > 0;
  }, []);

  const carregarInicial = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    pageRef.current = 0;
    let data: Promocao[] = [];
    let destaquesData: Promocao[] = [];

    try {
      const [countResult, pageResult, destaquesResult] = await Promise.all([
        contarPromocoes(filtrosRef.current),
        buscarPromocoesPagina(filtrosRef.current, 0, FEED_PAGE_SIZE),
        buscarDestaques({ loja: filtrosRef.current.loja }),
      ]);

      data = pageResult.data;
      destaquesData = destaquesResult.data;
      setPromocoes(data);
      setDestaques(destaquesData);
      setTotal(countResult.count);
      setHasMore(
        pageResult.data.length === FEED_PAGE_SIZE && pageResult.data.length < countResult.count,
      );
      setError(countResult.error ?? pageResult.error ?? destaquesResult.error);

      if (data.length > 0 || destaquesData.length > 0) {
        void saveFeedCache({
          promocoes: data,
          destaques: destaquesData,
          total: countResult.count,
        });
      }
    } catch (e) {
      console.error('[usePromocoesFeed] carregar:', e);
      const fromCache = await hidratarCache();
      setError(
        fromCache
          ? null
          : 'Não foi possível carregar as promoções. Puxe para atualizar.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }

    const firstLoad = isFirstLoad.current;
    isFirstLoad.current = false;
    void posCarregarFeed(data, firstLoad);
  }, [hidratarCache]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || refreshing || !hasMore) return;

    const nextPage = pageRef.current + 1;
    const offset = nextPage * FEED_PAGE_SIZE;

    setLoadingMore(true);
    try {
      const result = await buscarPromocoesPagina(filtrosRef.current, offset, FEED_PAGE_SIZE);
      if (result.error) {
        setError(result.error);
        return;
      }

      setPromocoes((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const novos = result.data.filter((p) => !ids.has(p.id));
        return [...prev, ...novos];
      });
      pageRef.current = nextPage;
      setHasMore(result.data.length === FEED_PAGE_SIZE && (nextPage + 1) * FEED_PAGE_SIZE < total);
    } catch (e) {
      console.error('[usePromocoesFeed] loadMore:', e);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loading, loadingMore, refreshing, total]);

  useEffect(() => {
    void hidratarCache();
  }, [hidratarCache]);

  useEffect(() => {
    void carregarInicial();
  }, [filtrosKey, carregarInicial]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const channel = supabase
      .channel(realtimeChannelId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'promocoes' }, (payload) => {
        const nova = normalizePromocao(payload.new as Record<string, unknown>);
        useFeedPrefsStore.getState().notifyNovaPromoFeed(nova);
        if (!promocaoMatchesFiltros(nova, filtrosRef.current)) return;
        setPromocoes((prev) => (prev.some((p) => p.id === nova.id) ? prev : [nova, ...prev]));
        setTotal((t) => t + 1);
        void handleNewPromo(nova);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'promocoes' }, (payload) => {
        const atualizada = normalizePromocao(payload.new as Record<string, unknown>);
        const anterior = payload.old
          ? normalizePromocao(payload.old as Record<string, unknown>)
          : undefined;
        if (!atualizada.aprovada) removeSaved(atualizada.id);
        else syncFromPromo(atualizada);

        const matches = promocaoMatchesFiltros(atualizada, filtrosRef.current);
        setPromocoes((prev) => {
          const prevItem = prev.find((p) => p.id === atualizada.id);
          void handlePromoUpdate(prevItem ?? anterior, atualizada);
          if (!atualizada.aprovada || !matches) {
            return prev.filter((p) => p.id !== atualizada.id);
          }
          return prev.map((p) => (p.id === atualizada.id ? atualizada : p));
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'promocoes' }, (payload) => {
        const removida = payload.old as Promocao;
        removeSaved(removida.id);
        setPromocoes((prev) => prev.filter((p) => p.id !== removida.id));
        setTotal((t) => Math.max(0, t - 1));
      })
      .subscribe((status) => setAoVivo(status === 'SUBSCRIBED'));

    return () => { void supabase.removeChannel(channel); };
  }, [syncFromPromo, removeSaved, realtimeChannelId]);

  return {
    promocoes,
    total,
    destaques,
    loading,
    loadingMore,
    hasMore,
    refreshing,
    error,
    aoVivo,
    refresh: () => carregarInicial(true),
    loadMore,
  };
}
