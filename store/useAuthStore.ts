import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";

import {
  buscarPerfil,
  cadastrar,
  criarPerfil,
  entrar,
  getSession,
  sair,
} from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";
import type { PerfilUsuario } from "@/lib/types";
import { syncUserData } from "@/lib/userSync";

type AuthStore = {
  session: Session | null;
  perfil: PerfilUsuario | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  init: () => () => void;
  signIn: (email: string, senha: string) => Promise<boolean>;
  signUp: (email: string, senha: string, nome: string) => Promise<{ ok: boolean; needsConfirmation?: boolean }>;
  signOut: () => Promise<boolean>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
};

async function loadProfileForSession(session: Session | null): Promise<PerfilUsuario | null> {
  if (!session?.user) return null;

  let perfil = await buscarPerfil(session.user.id);
  if (!perfil) {
    const nome =
      (session.user.user_metadata?.nome as string | undefined) ??
      session.user.email?.split("@")[0] ??
      "Usuário";
    perfil = await criarPerfil(session.user.id, session.user.email ?? "", nome);
  }
  return perfil;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  perfil: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  init: () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      set({ isInitialized: true });
      return () => {};
    }

    void (async () => {
      const session = await getSession();
      const perfil = await loadProfileForSession(session);
      set({ session, perfil, isInitialized: true });
      if (session?.user) {
        await syncUserData(session.user.id);
      }
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      // Defer async work to avoid Supabase auth deadlock when calling
      // supabase.* queries inside the onAuthStateChange callback
      void Promise.resolve().then(async () => {
        const perfil = await loadProfileForSession(session);
        set({ session, perfil, isLoading: false });

        if (event === "SIGNED_IN" && session?.user) {
          await syncUserData(session.user.id);
        }
      });
    });

    return () => subscription.subscription.unsubscribe();
  },

  signIn: async (email, senha) => {
    set({ isLoading: true, error: null });
    const result = await entrar(email, senha);
    if (!result.ok) {
      set({ isLoading: false, error: result.error });
      return false;
    }
    set({ isLoading: false, error: null });
    await get().refreshProfile();
    return true;
  },

  signUp: async (email, senha, nome) => {
    set({ isLoading: true, error: null });
    const result = await cadastrar(email, senha, nome);
    if (!result.ok) {
      set({ isLoading: false, error: result.error });
      return { ok: false };
    }
    set({ isLoading: false, error: null });
    if (!result.needsConfirmation) {
      await get().refreshProfile();
    }
    return { ok: true, needsConfirmation: result.needsConfirmation };
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    const result = await sair();
    if (!result.ok) {
      set({ isLoading: false, error: result.error });
      return false;
    }
    set({ session: null, perfil: null, isLoading: false, error: null });
    return true;
  },

  clearError: () => set({ error: null }),

  refreshProfile: async () => {
    const { session } = get();
    const perfil = await loadProfileForSession(session);
    set({ perfil });
  },
}));
