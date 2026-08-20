import { useEffect, useState } from 'react';

import { filterPromocoesConfiaveis } from '@/lib/promoFormat';
import { getSupabaseClient } from '@/lib/supabase';
import type { Promocao } from '@/lib/types';

export function usePromoSimilares(promo: Promocao | null, limite = 8) {
  const [similares, setSimilares] = useState<Promocao[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!promo) {
      setSimilares([]);
      return;
    }

    let cancelled = false;

    async function carregar() {
      setCarregando(true);
      const supabase = getSupabaseClient();
      if (!supabase) {
        setCarregando(false);
        return;
      }

      let query = supabase
        .from('promocoes')
        .select('*')
        .eq('aprovada', true)
        .neq('id', promo!.id)
        .order('percentual_desconto', { ascending: false })
        .limit(limite);

      if (promo!.categoria) {
        query = query.eq('categoria', promo!.categoria);
      } else if (promo!.loja) {
        query = query.eq('loja', promo!.loja);
      }

      const { data, error } = await query;
      if (cancelled) return;

      if (!error && data && data.length > 0) {
        setSimilares(filterPromocoesConfiaveis(data as Promocao[]));
        setCarregando(false);
        return;
      }

      if (promo!.categoria && promo!.loja) {
        const fallback = await supabase
          .from('promocoes')
          .select('*')
          .eq('aprovada', true)
          .eq('loja', promo!.loja)
          .neq('id', promo!.id)
          .order('percentual_desconto', { ascending: false })
          .limit(limite);

        if (!cancelled && !fallback.error) {
          setSimilares(filterPromocoesConfiaveis((fallback.data ?? []) as Promocao[]));
        }
      } else {
        setSimilares([]);
      }
      setCarregando(false);
    }

    void carregar();
    return () => {
      cancelled = true;
    };
  }, [promo?.id, promo?.categoria, promo?.loja, limite]);

  return { similares, carregando };
}
