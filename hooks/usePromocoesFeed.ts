import { useCallback, useEffect, useMemo, useState } from "react";

import { buscarPromocoes, getSupabaseClient } from "@/lib/supabase";
import { CATEGORIA_TODAS, TODAS_AS_CATEGORIAS, type Promocao } from "@/lib/types";

export function usePromocoesFeed() {
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [categoria, setCategoria] = useState(CATEGORIA_TODAS);
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
      .channel("promocoes-feed-mobile")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "promocoes" },
        (payload) => {
          const nova = payload.new as Promocao;
          if (!nova.aprovada) return;
          setPromocoes((prev) =>
            prev.some((p) => p.id === nova.id) ? prev : [nova, ...prev],
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "promocoes" },
        (payload) => {
          const atualizada = payload.new as Promocao;
          setPromocoes((prev) =>
            atualizada.aprovada
              ? prev.map((p) => (p.id === atualizada.id ? atualizada : p))
              : prev.filter((p) => p.id !== atualizada.id),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "promocoes" },
        (payload) => {
          const removida = payload.old as Promocao;
          setPromocoes((prev) => prev.filter((p) => p.id !== removida.id));
        },
      )
      .subscribe((status) => setAoVivo(status === "SUBSCRIBED"));

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  // Contagem por categoria usando a lista fixa (igual ao site)
  const contagemPorCategoria = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of TODAS_AS_CATEGORIAS) counts[cat] = 0;
    for (const p of promocoes) {
      if (p.categoria && counts[p.categoria] !== undefined) {
        counts[p.categoria] += 1;
      }
    }
    return counts;
  }, [promocoes]);

  const filtradas = useMemo(() => {
    if (categoria === CATEGORIA_TODAS) return promocoes;
    return promocoes.filter((p) => p.categoria === categoria);
  }, [promocoes, categoria]);

  return {
    promocoes: filtradas,
    total: promocoes.length,
    destaques: promocoes.slice(0, 5),
    contagemPorCategoria,
    categoria,
    setCategoria,
    loading,
    refreshing,
    error,
    aoVivo,
    refresh: () => carregar(true),
  };
}
