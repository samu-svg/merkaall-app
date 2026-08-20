import { useState, useEffect, useCallback } from 'react';
import { filterPromocoesConfiaveis, normalizePromocao } from '../lib/promoFormat';
import { getSupabaseClient } from '../lib/supabase';
import { getEffectiveUserId } from '../lib/userId';
import type { Promocao } from '../lib/types';
import { useAuthStore } from '../store/useAuthStore';

export interface PromocaoRecomendada extends Promocao {
  score:  number;
  tipo:   'relevante' | 'descoberta';
}

interface Estado {
  promocoes:  PromocaoRecomendada[];
  carregando: boolean;
  erro:       string | null;
  isNovo:     boolean;
}

export function useFeedRecomendado(limite = 30) {
  const sessionUserId = useAuthStore((s) => s.session?.user?.id ?? null);
  const [estado, setEstado] = useState<Estado>({
    promocoes: [], carregando: true, erro: null, isNovo: false,
  });

  const carregar = useCallback(async () => {
    setEstado(prev => ({ ...prev, carregando: true, erro: null }));
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase não configurado');

      const userId = await getEffectiveUserId();

      const { data, error } = await supabase
        .rpc('recomendar_promocoes', { p_user_id: userId, p_limite: limite });

      let rows = data;

      if (error) {
        console.warn('[FeedRecomendado] RPC falhou, usando fallback:', error.message);
        const fallback = await supabase
          .from('promocoes')
          .select('*')
          .eq('aprovada', true)
          .order('percentual_desconto', { ascending: false })
          .limit(limite);
        if (fallback.error) throw error;
        rows = (fallback.data ?? []).map((p) => ({
          ...p,
          score: p.percentual_desconto,
          tipo: 'descoberta',
        }));
      }

      const promocoes = filterPromocoesConfiaveis(
        (rows ?? []).map((row: Record<string, unknown>) =>
          normalizePromocao(row),
        ) as PromocaoRecomendada[],
      );
      const isNovo = promocoes.length === 0 || promocoes.every(p => p.tipo === 'descoberta');

      setEstado({ promocoes, carregando: false, erro: null, isNovo });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar recomendações.';
      console.error('[FeedRecomendado]', err);
      setEstado(prev => ({ ...prev, carregando: false, erro: message }));
    }
  }, [limite]);

  useEffect(() => { void carregar(); }, [carregar, sessionUserId]);

  return { ...estado, recarregar: carregar };
}
