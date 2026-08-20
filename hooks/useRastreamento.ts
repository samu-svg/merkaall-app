import { useCallback, useRef } from 'react';
import { track } from '@/lib/analytics';
import { getSupabaseClient } from '../lib/supabase';
import { getEffectiveUserId } from '../lib/userId';
import type { Promocao } from '../lib/types';

const FUNNEL_EVENTS = new Set(['view', 'open_link', 'favorite']);

const PESOS: Record<string, number> = {
  view:       1,
  click:      3,
  open_link:  5,
  favorite:   8,
  search:     4,
  skip:      -1,
};

export function useRastreamento() {
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const registrar = useCallback(async (
    tipo: keyof typeof PESOS,
    promocao: Promocao
  ) => {
    if (FUNNEL_EVENTS.has(tipo)) {
      track(tipo, {
        promocao_id: promocao.id,
        categoria: promocao.categoria ?? null,
        loja: promocao.loja ?? null,
      });
    }

    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const userId = await getEffectiveUserId();
      await supabase.from('user_events').insert({
        user_id:     userId,
        promocao_id: promocao.id,
        event_type:  tipo,
        peso:        PESOS[tipo] ?? 1,
        categoria:   promocao.categoria ?? null,
        preco:       promocao.preco_desconto ?? null,
      });
    } catch (err) {
      console.warn('[Rastreamento] Falhou silenciosamente:', err);
    }
  }, []);

  const iniciarView = useCallback((promocao: Promocao) => {
    const key = String(promocao.id);
    if (timerRef.current[key]) return;
    timerRef.current[key] = setTimeout(() => {
      void registrar('view', promocao);
      delete timerRef.current[key];
    }, 2000);
  }, [registrar]);

  const cancelarView = useCallback((promocaoId: string) => {
    const key = String(promocaoId);
    if (timerRef.current[key]) {
      clearTimeout(timerRef.current[key]);
      delete timerRef.current[key];
    }
  }, []);

  return { registrar, iniciarView, cancelarView };
}
