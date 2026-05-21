import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import 'react-native-get-random-values';

import type { AlertaPreco } from '@/lib/types';

const STORAGE_KEY = '@promocaopro:alerts';

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type AlertsStore = {
  alertas: AlertaPreco[];
  isLoaded: boolean;
  load: () => Promise<void>;
  adicionar: (titulo: string, categoria: string | null, precoMaximo: number) => void;
  toggleAtivo: (id: string) => void;
  remover: (id: string) => void;
};

export const useAlertsStore = create<AlertsStore>((set, get) => ({
  alertas: [],
  isLoaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const alertas: AlertaPreco[] = raw ? (JSON.parse(raw) as AlertaPreco[]) : [];
      set({ alertas, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  adicionar: (titulo, categoria, precoMaximo) => {
    const novo: AlertaPreco = {
      id: uuid(),
      titulo,
      categoria,
      precoMaximo,
      ativo: true,
      criadoEm: new Date().toISOString(),
    };
    const next = [novo, ...get().alertas];
    set({ alertas: next });
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  },

  toggleAtivo: (id) => {
    const next = get().alertas.map((a) =>
      a.id === id ? { ...a, ativo: !a.ativo } : a,
    );
    set({ alertas: next });
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  },

  remover: (id) => {
    const next = get().alertas.filter((a) => a.id !== id);
    set({ alertas: next });
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  },
}));
