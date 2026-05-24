import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { getDeviceId } from '../lib/deviceId';
import type { Promocao } from '../lib/types';

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
  const [estado, setEstado] = useState<Estado>({
    promocoes: [], carregando: true, erro: null, isNovo: false,
  });

  const carregar = useCallback(async () => {
    setEstado(prev => ({ ...prev, carregando: true, erro: null }));
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase não configurado');

      const userId = await getDeviceId();

      const { data, error } = await supabase
        .rpc('recomendar_promocoes', { p_user_id: userId, p_limite: limite });

      if (error) throw error;

      const promocoes = (data ?? []) as PromocaoRecomendada[];
      const isNovo = promocoes.length === 0 || promocoes.every(p => p.tipo === 'descoberta');

      setEstado({ promocoes, carregando: false, erro: null, isNovo });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar recomendações.';
      console.error('[FeedRecomendado]', err);
      setEstado(prev => ({ ...prev, carregando: false, erro: message }));
    }
  }, [limite]);

  useEffect(() => { void carregar(); }, [carregar]);

  return { ...estado, recarregar: carregar };
}
