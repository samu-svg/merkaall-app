import AsyncStorage from '@react-native-async-storage/async-storage';

import { create } from 'zustand';



import { normalizePromocao } from '@/lib/promoFormat';
import { maybeRequestReview } from '@/lib/review';

import type { Promocao } from '@/lib/types';

import {

  cloudRemovePromo,

  cloudRemovePromos,

  cloudSavePromo,

  getLoggedUserId,

  migrateLegacyUserStorage,

  SAVED_PRICES_KEY,

  SAVED_STORAGE_KEY,

  syncSavedIfLoggedIn,

} from '@/lib/userSync';



type SavedStore = {

  saved: Promocao[];

  precoQuandoSalvo: Record<string, number>;

  isLoaded: boolean;

  load: () => Promise<void>;

  toggle: (promo: Promocao) => void;

  isSaved: (id: string) => boolean;

  getPrecoQuandoSalvo: (id: string) => number | undefined;

  remove: (id: string) => void;

  pruneMissing: (activeIds: string[]) => void;

  syncFromPromo: (promo: Promocao) => void;

  setFromSync: (saved: Promocao[]) => void;

};



function persistLocal(saved: Promocao[]) {

  void AsyncStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(saved));

}



function persistPrecos(precos: Record<string, number>) {

  void AsyncStorage.setItem(SAVED_PRICES_KEY, JSON.stringify(precos));

}



function mergePrecosForSaved(

  saved: Promocao[],

  current: Record<string, number>,

): Record<string, number> {

  const next = { ...current };

  const savedIds = new Set(saved.map((p) => p.id));



  for (const promo of saved) {

    if (!(promo.id in next)) {

      next[promo.id] = promo.preco_desconto;

    }

  }



  for (const id of Object.keys(next)) {

    if (!savedIds.has(id)) delete next[id];

  }



  return next;

}



export const useSavedStore = create<SavedStore>((set, get) => ({

  saved: [],

  precoQuandoSalvo: {},

  isLoaded: false,



  load: async () => {

    try {

      await migrateLegacyUserStorage();

      const [rawSaved, rawPrecos] = await Promise.all([

        AsyncStorage.getItem(SAVED_STORAGE_KEY),

        AsyncStorage.getItem(SAVED_PRICES_KEY),

      ]);

      const saved: Promocao[] = rawSaved

        ? (JSON.parse(rawSaved) as Record<string, unknown>[]).map(normalizePromocao)

        : [];

      const storedPrecos: Record<string, number> = rawPrecos

        ? (JSON.parse(rawPrecos) as Record<string, number>)

        : {};

      const precoQuandoSalvo = mergePrecosForSaved(saved, storedPrecos);

      set({ saved, precoQuandoSalvo, isLoaded: true });

      if (JSON.stringify(storedPrecos) !== JSON.stringify(precoQuandoSalvo)) {

        persistPrecos(precoQuandoSalvo);

      }

      void syncSavedIfLoggedIn();

    } catch {

      set({ isLoaded: true });

    }

  },



  setFromSync: (saved) => {

    const precoQuandoSalvo = mergePrecosForSaved(saved, get().precoQuandoSalvo);

    set({ saved, precoQuandoSalvo, isLoaded: true });

    persistLocal(saved);

    persistPrecos(precoQuandoSalvo);

  },



  toggle: (promo: Promocao) => {

    const { saved, precoQuandoSalvo } = get();

    const exists = saved.some((p) => p.id === promo.id);

    const next = exists

      ? saved.filter((p) => p.id !== promo.id)

      : [promo, ...saved];



    const nextPrecos = { ...precoQuandoSalvo };

    if (exists) {

      delete nextPrecos[promo.id];

    } else {

      nextPrecos[promo.id] = promo.preco_desconto;

    }



    set({ saved: next, precoQuandoSalvo: nextPrecos });

    persistLocal(next);

    persistPrecos(nextPrecos);

    if (!exists) {
      void maybeRequestReview('favorite');
    }

    void (async () => {

      const userId = await getLoggedUserId();

      if (!userId) return;

      if (exists) await cloudRemovePromo(userId, promo.id);

      else await cloudSavePromo(userId, promo.id);

    })();

  },



  isSaved: (id: string) => get().saved.some((p) => p.id === id),



  getPrecoQuandoSalvo: (id: string) => get().precoQuandoSalvo[id],



  remove: (id: string) => {

    const { saved, precoQuandoSalvo } = get();

    const next = saved.filter((p) => p.id !== id);

    const nextPrecos = { ...precoQuandoSalvo };

    delete nextPrecos[id];

    set({ saved: next, precoQuandoSalvo: nextPrecos });

    persistLocal(next);

    persistPrecos(nextPrecos);



    void (async () => {

      const userId = await getLoggedUserId();

      if (userId) await cloudRemovePromo(userId, id);

    })();

  },



  pruneMissing: (activeIds) => {

    const active = new Set(activeIds);

    const { saved, precoQuandoSalvo } = get();

    const next = saved.filter((p) => active.has(p.id));

    if (next.length === saved.length) return;



    const removedIds = saved.filter((p) => !active.has(p.id)).map((p) => p.id);

    const nextPrecos = { ...precoQuandoSalvo };

    for (const id of removedIds) delete nextPrecos[id];



    set({ saved: next, precoQuandoSalvo: nextPrecos });

    persistLocal(next);

    persistPrecos(nextPrecos);



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

            fotos_urls: promo.fotos_urls,

            link_afiliado: promo.link_afiliado,

            loja: promo.loja,

            expires_at: promo.expires_at,

          }

        : p,

    );

    set({ saved: next });

    persistLocal(next);

  },

}));


