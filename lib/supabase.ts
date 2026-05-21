import "react-native-url-polyfill/auto";

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
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 5 } },
    });
    return _client;
  } catch (err) {
    console.error("[supabase] createClient falhou:", err);
    return null;
  }
}

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

  const { data, error } = await supabase
    .from("promocoes")
    .select("*")
    .eq("aprovada", true)
    .order("percentual_desconto", { ascending: false })
    .limit(120);

  if (error) {
    return { data: [], error: error.message };
  }
  return { data: (data ?? []) as import("./types").Promocao[], error: null };
}
