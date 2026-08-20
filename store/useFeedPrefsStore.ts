import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { STORAGE_PREFIX } from '@/constants/brand';
import type { Promocao } from '@/lib/types';

export const FEED_CATEGORIAS_MIN = 1;
export const FEED_CATEGORIAS_MAX = 5;
export const FEED_CATEGORIAS_ONBOARDING_MIN = 3;

const CATEGORIAS_KEY = `${STORAGE_PREFIX}:feed_categorias`;
const LAST_VISIT_KEY = `${STORAGE_PREFIX}:feed_last_visit`;

type FeedPrefsStore = {
  categorias: string[];
  lastVisitAt: string | null;
  feedUnreadCount: number;
  isLoaded: boolean;
  load: () => Promise<void>;
  setCategorias: (cats: string[]) => Promise<void>;
  markVisited: () => Promise<void>;
  countUnread: (promos: Promocao[]) => number;
  syncUnreadCount: (promos: Promocao[]) => void;
  incrementFeedUnread: () => void;
  notifyNovaPromoFeed: (promo: Promocao) => void;
};

export const useFeedPrefsStore = create<FeedPrefsStore>((set, get) => ({
  categorias: [],
  lastVisitAt: null,
  feedUnreadCount: 0,
  isLoaded: false,

  load: async () => {
    try {
      const [catsRaw, visitRaw] = await Promise.all([
        AsyncStorage.getItem(CATEGORIAS_KEY),
        AsyncStorage.getItem(LAST_VISIT_KEY),
      ]);
      const categorias: string[] = catsRaw ? (JSON.parse(catsRaw) as string[]) : [];
      const lastVisitAt = visitRaw ?? null;
      set({ categorias, lastVisitAt, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  setCategorias: async (cats) => {
    const unique = [...new Set(cats)].slice(0, FEED_CATEGORIAS_MAX);
    set({ categorias: unique });
    await AsyncStorage.setItem(CATEGORIAS_KEY, JSON.stringify(unique));
  },

  markVisited: async () => {
    const now = new Date().toISOString();
    set({ lastVisitAt: now, feedUnreadCount: 0 });
    await AsyncStorage.setItem(LAST_VISIT_KEY, now);
  },

  countUnread: (promos) => {
    const { lastVisitAt, categorias } = get();
    if (categorias.length === 0) return 0;

    const since = lastVisitAt ? new Date(lastVisitAt).getTime() : 0;
    const catSet = new Set(categorias);

    return promos.filter((p) => {
      if (!p.categoria || !catSet.has(p.categoria)) return false;
      return new Date(p.criada_em).getTime() > since;
    }).length;
  },

  syncUnreadCount: (promos) => {
    const count = get().countUnread(promos);
    set({ feedUnreadCount: count });
  },

  incrementFeedUnread: () => {
    set({ feedUnreadCount: get().feedUnreadCount + 1 });
  },

  notifyNovaPromoFeed: (promo) => {
    const { categorias } = get();
    if (categorias.length === 0) return;
    if (!promo.categoria || !categorias.includes(promo.categoria)) return;
    if (!promo.aprovada) return;
    set({ feedUnreadCount: get().feedUnreadCount + 1 });
  },
}));
