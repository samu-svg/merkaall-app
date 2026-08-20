import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getDeviceId } from "./deviceId";
import { applyFiltrosFeed, FEED_PAGE_SIZE, type FiltrosFeed } from "./feedQuery";
import { filterPromocoesConfiaveis, normalizePromocao } from "./promoFormat";
import { PRECO_MAX_PADRAO, DESCONTO_MAX_PADRAO, type Promocao } from "./types";

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
      global: {
        fetch: async (input, init) => {
          const deviceId = await getDeviceId();
          const headers = new Headers(init?.headers);
          headers.set("x-device-id", deviceId);
          return fetch(input, { ...init, headers });
        },
      },
    });
    return _client;
  } catch (err) {
    console.error("[supabase] createClient falhou:", err);
    return null;
  }
}

const FETCH_TIMEOUT_MS = 60_000;

export { FEED_PAGE_SIZE };

function envError(): string {
  return "Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env";
}

export async function contarPromocoes(
  filtros: FiltrosFeed,
): Promise<{ count: number; error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { count: 0, error: envError() };

  try {
    const query = applyFiltrosFeed(
      supabase.from("promocoes").select("*", { count: "exact", head: true }),
      filtros,
    );
    const { count, error } = await query;
    if (error) return { count: 0, error: error.message };
    return { count: count ?? 0, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao contar promoções.";
    return { count: 0, error: message };
  }
}

export async function buscarPromocoesPagina(
  filtros: FiltrosFeed,
  offset: number,
  limit = FEED_PAGE_SIZE,
): Promise<{ data: Promocao[]; error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: [], error: envError() };

  const fetchPage = async (): Promise<{ data: Promocao[]; error: string | null }> => {
    const query = applyFiltrosFeed(supabase.from("promocoes").select("*"), filtros).range(
      offset,
      offset + limit - 1,
    );
    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return {
      data: filterPromocoesConfiaveis(
        (data ?? []).map((row) => normalizePromocao(row as Record<string, unknown>)),
      ),
      error: null,
    };
  };

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Tempo esgotado ao buscar promoções. Verifique sua conexão.")),
        FETCH_TIMEOUT_MS,
      ),
    );
    return await Promise.race([fetchPage(), timeoutPromise]);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao buscar promoções.";
    return { data: [], error: message };
  }
}

export async function buscarDestaques(
  filtros: Pick<FiltrosFeed, "loja">,
  limit = 5,
): Promise<{ data: Promocao[]; error: string | null }> {
  return buscarPromocoesPagina(
    { ...filtros, categoria: "Todas", categorias: [], freteGratis: false, descontoMaximo: DESCONTO_MAX_PADRAO, precoMin: 0, precoMax: PRECO_MAX_PADRAO, ordenacao: "desconto" },
    0,
    limit,
  );
}

export async function buscarPromocaoPorId(
  id: string,
): Promise<{ data: Promocao | null; error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: envError() };

  try {
    const { data, error } = await supabase
      .from("promocoes")
      .select("*")
      .eq("id", id)
      .eq("aprovada", true)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    return {
      data: data ? normalizePromocao(data as Record<string, unknown>) : null,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao buscar promoção.";
    return { data: null, error: message };
  }
}

/** @deprecated Use buscarPromocoesPagina — carrega só a primeira página. */
export async function buscarPromocoes(): Promise<{
  data: Promocao[];
  error: string | null;
}> {
  return buscarPromocoesPagina(
    {
      loja: "Todas",
      categoria: "Todas",
      categorias: [],
      freteGratis: false,
      descontoMaximo: DESCONTO_MAX_PADRAO,
      precoMin: 0,
      precoMax: 2000,
      ordenacao: "desconto",
    },
    0,
    FEED_PAGE_SIZE,
  );
}
