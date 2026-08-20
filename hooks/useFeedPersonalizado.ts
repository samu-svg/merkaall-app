import { useCallback, useEffect, useMemo, useState } from 'react';

import { usePromocoesFeed } from '@/hooks/usePromocoesFeed';
import { agruparFeedPorDia, inverterSecoesFeed, type FeedDiaSecao } from '@/lib/feedGroup';
import { filterPromocoesConfiaveis, normalizePromocao } from '@/lib/promoFormat';
import { getSupabaseClient } from '@/lib/supabase';
import { getEffectiveUserId } from '@/lib/userId';
import { FILTROS_PADRAO, type Promocao } from '@/lib/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useFeedPrefsStore } from '@/store/useFeedPrefsStore';

export type PromocaoFeedEnriquecida = Promocao & {
  score?: number;
  tipo?: 'relevante' | 'descoberta';
  recomendado?: boolean;
};

type ScoreMeta = {
  score: number;
  tipo: 'relevante' | 'descoberta';
};

const DISCOVERY_LIMIT = 5;

function enriquecerPromo(promo: Promocao, meta?: ScoreMeta): PromocaoFeedEnriquecida {
  if (!meta) return promo;
  return {
    ...promo,
    score: meta.score,
    tipo: meta.tipo,
    recomendado: meta.tipo === 'relevante' && meta.score >= 5,
  };
}

export function useFeedPersonalizado() {
  const categorias = useFeedPrefsStore((s) => s.categorias);
  const sessionUserId = useAuthStore((s) => s.session?.user?.id ?? null);

  const filtros = useMemo(
    () => ({
      ...FILTROS_PADRAO,
      categorias: categorias.length > 0 ? categorias : ['__feed_sem_categorias__'],
      ordenacao: 'recente' as const,
    }),
    [categorias],
  );

  const feed = usePromocoesFeed(filtros);
  const [scoreMap, setScoreMap] = useState<Map<string, ScoreMeta>>(new Map());
  const [scoresLoading, setScoresLoading] = useState(false);

  const carregarScores = useCallback(async () => {
    setScoresLoading(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const userId = await getEffectiveUserId();
      const { data, error } = await supabase.rpc('recomendar_promocoes', {
        p_user_id: userId,
        p_limite: 50,
      });

      if (error) {
        console.warn('[useFeedPersonalizado] RPC falhou:', error.message);
        return;
      }

      const map = new Map<string, ScoreMeta>();
      for (const row of data ?? []) {
        const id = String((row as Record<string, unknown>).id);
        const score = Number((row as Record<string, unknown>).score ?? 0);
        const tipo = (row as Record<string, unknown>).tipo as 'relevante' | 'descoberta';
        map.set(id, { score, tipo });
      }
      setScoreMap(map);
    } catch (err) {
      console.warn('[useFeedPersonalizado] scores:', err);
    } finally {
      setScoresLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregarScores();
  }, [carregarScores, sessionUserId, categorias]);

  const promocoesEnriquecidas = useMemo(
    () => feed.promocoes.map((p) => enriquecerPromo(p, scoreMap.get(p.id))),
    [feed.promocoes, scoreMap],
  );

  const secoes: FeedDiaSecao[] = useMemo(() => {
    const agrupadas = agruparFeedPorDia(promocoesEnriquecidas);
    return inverterSecoesFeed(agrupadas);
  }, [promocoesEnriquecidas]);

  const descobertaIds = useMemo(() => {
    if (categorias.length === 0 || scoreMap.size === 0) return [] as string[];

    const feedIds = new Set(feed.promocoes.map((p) => p.id));
    const ids: string[] = [];

    for (const [id, meta] of scoreMap) {
      if (meta.tipo !== 'descoberta' || feedIds.has(id)) continue;
      ids.push(id);
      if (ids.length >= DISCOVERY_LIMIT * 2) break;
    }

    return ids;
  }, [categorias, scoreMap, feed.promocoes]);

  const [descobertaCompleta, setDescobertaCompleta] = useState<PromocaoFeedEnriquecida[]>([]);

  useEffect(() => {
    if (descobertaIds.length === 0) {
      setDescobertaCompleta([]);
      return;
    }

    let cancelled = false;

    void (async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const catSet = new Set(categorias);
      const { data } = await supabase.from('promocoes').select('*').in('id', descobertaIds);

      if (cancelled || !data) return;

      const items = filterPromocoesConfiaveis(
        (data as Record<string, unknown>[]).map((row) => normalizePromocao(row)),
      )
        .filter((p) => p.categoria && !catSet.has(p.categoria))
        .map((p) => enriquecerPromo(p, scoreMap.get(p.id)))
        .slice(0, DISCOVERY_LIMIT);

      setDescobertaCompleta(items);
    })();

    return () => {
      cancelled = true;
    };
  }, [descobertaIds, categorias, scoreMap]);

  const refresh = useCallback(() => {
    feed.refresh();
    void carregarScores();
  }, [feed, carregarScores]);

  const syncUnreadCount = useFeedPrefsStore((s) => s.syncUnreadCount);

  useEffect(() => {
    syncUnreadCount(promocoesEnriquecidas);
  }, [promocoesEnriquecidas, syncUnreadCount]);

  return {
    categorias,
    secoes,
    descoberta: descobertaCompleta,
    loading: feed.loading || (categorias.length > 0 && scoresLoading && scoreMap.size === 0),
    loadingMore: feed.loadingMore,
    refreshing: feed.refreshing,
    hasMore: feed.hasMore,
    aoVivo: feed.aoVivo,
    erro: feed.error,
    promocoes: promocoesEnriquecidas,
    refresh,
    loadMore: feed.loadMore,
  };
}

export type UseFeedPersonalizadoReturn = {
  categorias: string[];
  secoes: FeedDiaSecao[];
  descoberta: PromocaoFeedEnriquecida[];
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  hasMore: boolean;
  aoVivo: boolean;
  erro: string | null;
  promocoes: PromocaoFeedEnriquecida[];
  refresh: () => void;
  loadMore: () => void;
};
