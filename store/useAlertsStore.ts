import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { AlertaPreco, NovoAlertaInput } from '@/lib/types';
import {
  ALERTS_STORAGE_KEY,
  cloudDeleteAlert,
  cloudUpdateAlert,
  cloudUpsertAlert,
  getLoggedUserId,
  migrateLegacyUserStorage,
  syncAlertsIfLoggedIn,
} from '@/lib/userSync';

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function normalizeAlerta(raw: AlertaPreco): AlertaPreco {
  return {
    ...raw,
    precoMaximo: raw.precoMaximo ?? null,
    descontoMinimo: raw.descontoMinimo ?? 0,
  };
}

function persistLocal(alertas: AlertaPreco[]) {
  void AsyncStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alertas));
}

type AlertsStore = {
  alertas: AlertaPreco[];
  isLoaded: boolean;
  load: () => Promise<void>;
  adicionar: (input: NovoAlertaInput) => void;
  toggleAtivo: (id: string) => void;
  remover: (id: string) => void;
  setFromSync: (alertas: AlertaPreco[]) => void;
};

export const useAlertsStore = create<AlertsStore>((set, get) => ({
  alertas: [],
  isLoaded: false,

  load: async () => {
    try {
      await migrateLegacyUserStorage();
      const raw = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
      const alertas: AlertaPreco[] = raw
        ? (JSON.parse(raw) as AlertaPreco[]).map(normalizeAlerta)
        : [];
      set({ alertas, isLoaded: true });
      void syncAlertsIfLoggedIn();
    } catch {
      set({ isLoaded: true });
    }
  },

  setFromSync: (alertas) => {
    const normalized = alertas.map(normalizeAlerta);
    set({ alertas: normalized, isLoaded: true });
    persistLocal(normalized);
  },

  adicionar: (input) => {
    const novo: AlertaPreco = {
      id: uuid(),
      titulo: input.titulo.trim(),
      categoria: null,
      precoMaximo: input.precoMaximo ?? null,
      descontoMinimo: input.descontoMinimo ?? 0,
      ativo: input.ativo ?? true,
      criadoEm: new Date().toISOString(),
    };
    const next = [novo, ...get().alertas];
    set({ alertas: next });
    persistLocal(next);

    void (async () => {
      const userId = await getLoggedUserId();
      if (userId) await cloudUpsertAlert(userId, novo);
    })();
  },

  toggleAtivo: (id) => {
    const current = get().alertas.find((a) => a.id === id);
    if (!current) return;

    const next = get().alertas.map((a) =>
      a.id === id ? { ...a, ativo: !a.ativo } : a,
    );
    set({ alertas: next });
    persistLocal(next);

    void (async () => {
      const userId = await getLoggedUserId();
      if (userId) await cloudUpdateAlert(userId, id, { ativo: !current.ativo });
    })();
  },

  remover: (id) => {
    const next = get().alertas.filter((a) => a.id !== id);
    set({ alertas: next });
    persistLocal(next);

    void (async () => {
      const userId = await getLoggedUserId();
      if (userId) await cloudDeleteAlert(userId, id);
    })();
  },
}));

