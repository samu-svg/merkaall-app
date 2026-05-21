import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { Promocao } from '@/lib/types';

const STORAGE_KEY = '@promocaopro:saved';

type SavedStore = {
  saved: Promocao[];
  isLoaded: boolean;
  load: () => Promise<void>;
  toggle: (promo: Promocao) => void;
  isSaved: (id: string) => boolean;
  remove: (id: string) => void;
};

export const useSavedStore = create<SavedStore>((set, get) => ({
  saved: [],
  isLoaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const saved: Promocao[] = raw ? (JSON.parse(raw) as Promocao[]) : [];
      set({ saved, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  toggle: (promo: Promocao) => {
    const { saved } = get();
    const exists = saved.some((p) => p.id === promo.id);
    const next = exists
      ? saved.filter((p) => p.id !== promo.id)
      : [promo, ...saved];
    set({ saved: next });
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  },

  isSaved: (id: string) => get().saved.some((p) => p.id === id),

  remove: (id: string) => {
    const next = get().saved.filter((p) => p.id !== id);
    set({ saved: next });
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  },
}));
