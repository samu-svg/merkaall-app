import { create } from 'zustand';

import type { Promocao } from '@/lib/types';

type PromoDetailStore = {
  promo: Promocao | null;
  open: (promo: Promocao) => void;
  setPromo: (promo: Promocao) => void;
  close: () => void;
};

export const usePromoDetailStore = create<PromoDetailStore>((set) => ({
  promo: null,
  open: (promo) => set({ promo }),
  setPromo: (promo) => set({ promo }),
  close: () => set({ promo: null }),
}));
