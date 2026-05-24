import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { Promocao } from '@/lib/types';
import {
  ALERTS_STORAGE_KEY,
  cloudRemovePromo,
  cloudRemovePromos,
  cloudSavePromo,
  getLoggedUserId,
  SAVED_STORAGE_KEY,
  syncSavedIfLoggedIn,
} from '@/lib/userSync';

type SavedStore = {
  saved: Promocao[];
  isLoaded: boolean;
  load: () => Promise<void>;
  toggle: (promo: Promocao) => void;
  isSaved: (id: string) => boolean;
  remove: (id: string) => void;
  pruneMissing: (activeIds: string[]) => void;
  syncFromPromo: (promo: Promocao) => void;
  setFromSync: (saved: Promocao[]) => void;
};

function persistLocal(saved: Promocao[]) {
  void AsyncStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(saved));
}

export const useSavedStore = create<SavedStore>((set, get) => ({
  saved: [],
  isLoaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(SAVED_STORAGE_KEY);
      const saved: Promocao[] = raw ? (JSON.parse(raw) as Promocao[]) : [];
      set({ saved, isLoaded: true });
      await syncSavedIfLoggedIn();
    } catch {
      set({ isLoaded: true });
    }
  },

  setFromSync: (saved) => {
    set({ saved, isLoaded: true });
    persistLocal(saved);
  },

  toggle: (promo: Promocao) => {
    const { saved } = get();
    const exists = saved.some((p) => p.id === promo.id);
    const next = exists
      ? saved.filter((p) => p.id !== promo.id)
      : [promo, ...saved];
    set({ saved: next });
    persistLocal(next);

    void (async () => {
      const userId = await getLoggedUserId();
      if (!userId) return;
      if (exists) await cloudRemovePromo(userId, promo.id);
      else await cloudSavePromo(userId, promo.id);
    })();
  },

  isSaved: (id: string) => get().saved.some((p) => p.id === id),

  remove: (id: string) => {
    const next = get().saved.filter((p) => p.id !== id);
    set({ saved: next });
    persistLocal(next);

    void (async () => {
      const userId = await getLoggedUserId();
      if (userId) await cloudRemovePromo(userId, id);
    })();
  },

  pruneMissing: (activeIds) => {
    const active = new Set(activeIds);
    const { saved } = get();
    const next = saved.filter((p) => active.has(p.id));
    if (next.length === saved.length) return;

    const removedIds = saved.filter((p) => !active.has(p.id)).map((p) => p.id);
    set({ saved: next });
    persistLocal(next);

    void (async () => {
      const userId = await getLoggedUserId();
      if (userId) await cloudRemovePromos(userId, removedIds);
    })();
  },

  syncFromPromo: (promo) => {
    const { saved } = get();
    if (!saved.some((p) => p.id === promo.id)) return;
    const next = saved.map((p) =>
      p.id === promo.id
        ? {
            ...p,
            preco_desconto: promo.preco_desconto,
            preco_original: promo.preco_original,
            percentual_desconto: promo.percentual_desconto,
            titulo: promo.titulo,
            foto_url: promo.foto_url,
            link_afiliado: promo.link_afiliado,
            loja: promo.loja,
          }
        : p,
    );
    set({ saved: next });
    persistLocal(next);
  },
}));
