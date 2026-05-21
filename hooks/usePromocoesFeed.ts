import { useCallback, useEffect, useMemo, useState } from 'react';

import { buscarPromocoes, getSupabaseClient } from '@/lib/supabase';
import {
  CATEGORIA_TODAS,
  TODAS_AS_CATEGORIAS,
  type FiltrosAtivos,
  type Promocao,
} from '@/lib/types';

export function usePromocoesFeed(filtros: FiltrosAtivos) {
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aoVivo, setAoVivo] = useState(false);

  const carregar = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const { data, error: err } = await buscarPromocoes();
    setPromocoes(data);
    setError(err);
    setLoading(false);
    setRefreshing(false);
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
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'promocoes' }, (payload) => {
        const atualizada = payload.new as Promocao;
        setPromocoes((prev) =>
          atualizada.aprovada
            ? prev.map((p) => (p.id === atualizada.id ? atualizada : p))
            : prev.filter((p) => p.id !== atualizada.id),
        );
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'promocoes' }, (payload) => {
        const removida = payload.old as Promocao;
        setPromocoes((prev) => prev.filter((p) => p.id !== removida.id));
      })
      .subscribe((status) => setAoVivo(status === 'SUBSCRIBED'));

    return () => { void supabase.removeChannel(channel); };
  }, []);

  const contagemPorCategoria = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of TODAS_AS_CATEGORIAS) counts[cat] = 0;
    for (const p of promocoes) {
      if (p.categoria && counts[p.categoria] !== undefined) counts[p.categoria] += 1;
    }
    return counts;
  }, [promocoes]);

  const filtradas = useMemo(() => {
    let lista = [...promocoes];
    if (filtros.categoria !== CATEGORIA_TODAS) {
      lista = lista.filter((p) => p.categoria === filtros.categoria);
    }
    if (filtros.freteGratis) {
      lista = lista.filter((p) => p.frete_gratis === true);
    }
    if (filtros.descontoMinimo > 0) {
      lista = lista.filter((p) => p.percentual_desconto >= filtros.descontoMinimo);
    }
    if (filtros.precoMax != null) {
      lista = lista.filter((p) => p.preco_desconto <= filtros.precoMax!);
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
