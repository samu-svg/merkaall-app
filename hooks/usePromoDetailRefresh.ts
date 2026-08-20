import { useEffect, useState } from 'react';

import { buscarPromocaoPorId } from '@/lib/supabase';
import { usePromoDetailStore } from '@/store/usePromoDetailStore';

export function usePromoDetailRefresh(promoId: string | undefined) {
  const setPromo = usePromoDetailStore((s) => s.setPromo);
  const close = usePromoDetailStore((s) => s.close);
  const [refreshing, setRefreshing] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!promoId) return;

    let cancelled = false;

    async function refresh() {
      setRefreshing(true);
      setUnavailable(false);
      const { data, error } = await buscarPromocaoPorId(promoId!);
      if (cancelled) return;

      if (data) {
        setPromo(data);
      } else if (!error) {
        setUnavailable(true);
      }
      setRefreshing(false);
    }

    void refresh();
    return () => {
      cancelled = true;
    };
  }, [promoId, setPromo]);

  return { refreshing, unavailable, dismissUnavailable: close };
}
