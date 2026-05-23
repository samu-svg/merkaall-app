import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function readEnv(value: string | undefined): string | null {
  if (!value) return null;
  return value.trim().replace(/^['"]|['"]$/g, "").replace(/\/$/, "") || null;
}

function normalizeUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;

  const rawUrl = readEnv(process.env.EXPO_PUBLIC_SUPABASE_URL);
  const key = readEnv(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

  if (!rawUrl || !key) {
    console.warn("[supabase] EXPO_PUBLIC_SUPABASE_URL ou ANON_KEY ausentes.");
    return null;
  }

  const url = normalizeUrl(rawUrl);
  if (!isValidHttpUrl(url)) {
    console.error(`[supabase] URL inválida após sanitização: ${url}`);
    return null;
  }

  try {
    _client = createClient(url, key, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      realtime: { params: { eventsPerSecond: 5 } },
    });
    return _client;
  } catch (err) {
    console.error("[supabase] createClient falhou:", err);
    return null;
  }
}

const FETCH_TIMEOUT_MS = 60_000;
const FEED_PAGE_SIZE = 200;
const FEED_MAX_ITEMS = 5000;

export async function buscarPromocoes(): Promise<{
  data: import("./types").Promocao[];
  error: string | null;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      data: [],
      error: "Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env",
    };
  }

  const fetchAll = async (): Promise<{ data: import("./types").Promocao[]; error: string | null }> => {
    const acumulado: import("./types").Promocao[] = [];
    let offset = 0;

    while (acumulado.length < FEED_MAX_ITEMS) {
      const fim = Math.min(offset + FEED_PAGE_SIZE - 1, FEED_MAX_ITEMS - 1);
      const { data, error } = await supabase
        .from("promocoes")
        .select("*")
        .eq("aprovada", true)
        .order("percentual_desconto", { ascending: false })
        .range(offset, fim);

      if (error) {
        return { data: acumulado, error: error.message };
      }

      const pagina = (data ?? []) as import("./types").Promocao[];
      if (pagina.length === 0) break;

      acumulado.push(...pagina);
      if (pagina.length < FEED_PAGE_SIZE) break;
      offset += FEED_PAGE_SIZE;
    }

    return { data: acumulado, error: null };
  };

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Tempo esgotado ao buscar promoções. Verifique sua conexão.")),
        FETCH_TIMEOUT_MS,
      ),
    );

    return await Promise.race([fetchAll(), timeoutPromise]);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao buscar promoções.";
    return { data: [], error: message };
  }
}
