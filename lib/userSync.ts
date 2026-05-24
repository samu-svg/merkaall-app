import AsyncStorage from "@react-native-async-storage/async-storage";

import { getSession } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";
import type { AlertaPreco, Promocao } from "@/lib/types";
import { useAlertsStore } from "@/store/useAlertsStore";
import { useSavedStore } from "@/store/useSavedStore";

export const SAVED_STORAGE_KEY = "@promocaopro:saved";
export const ALERTS_STORAGE_KEY = "@promocaopro:alerts";

type AlertaPrecoRow = {
  id: string;
  user_id: string;
  titulo: string;
  categoria: string | null;
  preco_maximo: number | null;
  desconto_minimo: number;
  ativo: boolean;
  criado_em: string;
};

type SavedRow = {
  salvo_em: string;
  promocoes: Promocao | null;
};

function rowToAlerta(row: AlertaPrecoRow): AlertaPreco {
  return {
    id: row.id,
    titulo: row.titulo,
    categoria: row.categoria,
    precoMaximo: row.preco_maximo != null ? Number(row.preco_maximo) : null,
    descontoMinimo: Number(row.desconto_minimo),
    ativo: row.ativo,
    criadoEm: row.criado_em,
  };
}

function alertaToRow(userId: string, alerta: AlertaPreco): Omit<AlertaPrecoRow, "user_id"> & { user_id: string } {
  return {
    id: alerta.id,
    user_id: userId,
    titulo: alerta.titulo,
    categoria: alerta.categoria,
    preco_maximo: alerta.precoMaximo,
    desconto_minimo: alerta.descontoMinimo,
    ativo: alerta.ativo,
    criado_em: alerta.criadoEm,
  };
}

function alertaKey(alerta: Pick<AlertaPreco, "titulo" | "precoMaximo" | "descontoMinimo">): string {
  return [
    alerta.titulo.trim().toLowerCase(),
    alerta.precoMaximo ?? "null",
    alerta.descontoMinimo,
  ].join("|");
}

async function readLocalSaved(): Promise<Promocao[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Promocao[]) : [];
  } catch {
    return [];
  }
}

async function readLocalAlerts(): Promise<AlertaPreco[]> {
  try {
    const raw = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AlertaPreco[]) : [];
  } catch {
    return [];
  }
}

export async function getLoggedUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id ?? null;
}

export async function fetchSavedFromCloud(userId: string): Promise<Promocao[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("promocoes_salvas")
    .select("salvo_em, promocoes (*)")
    .eq("user_id", userId)
    .order("salvo_em", { ascending: false });

  if (error) {
    console.warn("[sync] fetchSavedFromCloud:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as SavedRow[])
    .map((row) => row.promocoes)
    .filter((promo): promo is Promocao => promo != null && promo.aprovada);
}

export async function fetchAlertsFromCloud(userId: string): Promise<AlertaPreco[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("alertas_preco")
    .select("id, user_id, titulo, categoria, preco_maximo, desconto_minimo, ativo, criado_em")
    .eq("user_id", userId)
    .order("criado_em", { ascending: false });

  if (error) {
    console.warn("[sync] fetchAlertsFromCloud:", error.message);
    return [];
  }

  return ((data ?? []) as AlertaPrecoRow[]).map(rowToAlerta);
}

async function mergeSavedToCloud(userId: string, local: Promocao[]): Promise<void> {
  if (local.length === 0) return;

  const supabase = getSupabaseClient();
  if (!supabase) return;

  const rows = local.map((promo) => ({
    user_id: userId,
    promocao_id: promo.id,
    salvo_em: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("promocoes_salvas")
    .upsert(rows, { onConflict: "user_id,promocao_id" });

  if (error) console.warn("[sync] mergeSavedToCloud:", error.message);
}

async function mergeAlertsToCloud(userId: string, local: AlertaPreco[]): Promise<void> {
  if (local.length === 0) return;

  const supabase = getSupabaseClient();
  if (!supabase) return;

  const cloud = await fetchAlertsFromCloud(userId);
  const cloudKeys = new Set(cloud.map(alertaKey));
  const toInsert = local.filter((alerta) => !cloudKeys.has(alertaKey(alerta)));

  if (toInsert.length === 0) return;

  const rows = toInsert.map((alerta) => ({
    user_id: userId,
    titulo: alerta.titulo,
    categoria: alerta.categoria,
    preco_maximo: alerta.precoMaximo,
    desconto_minimo: alerta.descontoMinimo,
    ativo: alerta.ativo,
    criado_em: alerta.criadoEm,
  }));

  const { error } = await supabase.from("alertas_preco").insert(rows);
  if (error) console.warn("[sync] mergeAlertsToCloud:", error.message);
}

export async function syncUserData(userId: string): Promise<void> {
  const [localSaved, localAlerts] = await Promise.all([
    readLocalSaved(),
    readLocalAlerts(),
  ]);

  await Promise.all([
    mergeSavedToCloud(userId, localSaved),
    mergeAlertsToCloud(userId, localAlerts),
  ]);

  const [saved, alertas] = await Promise.all([
    fetchSavedFromCloud(userId),
    fetchAlertsFromCloud(userId),
  ]);

  useSavedStore.getState().setFromSync(saved);
  useAlertsStore.getState().setFromSync(alertas);
}

export async function cloudSavePromo(userId: string, promocaoId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.from("promocoes_salvas").upsert(
    { user_id: userId, promocao_id: promocaoId, salvo_em: new Date().toISOString() },
    { onConflict: "user_id,promocao_id" },
  );

  if (error) console.warn("[sync] cloudSavePromo:", error.message);
}

export async function cloudRemovePromo(userId: string, promocaoId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("promocoes_salvas")
    .delete()
    .eq("user_id", userId)
    .eq("promocao_id", promocaoId);

  if (error) console.warn("[sync] cloudRemovePromo:", error.message);
}

export async function cloudRemovePromos(userId: string, promocaoIds: string[]): Promise<void> {
  if (promocaoIds.length === 0) return;

  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("promocoes_salvas")
    .delete()
    .eq("user_id", userId)
    .in("promocao_id", promocaoIds);

  if (error) console.warn("[sync] cloudRemovePromos:", error.message);
}

export async function cloudUpsertAlert(userId: string, alerta: AlertaPreco): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.from("alertas_preco").upsert(alertaToRow(userId, alerta));
  if (error) console.warn("[sync] cloudUpsertAlert:", error.message);
}

export async function cloudUpdateAlert(
  userId: string,
  alertaId: string,
  patch: Partial<Pick<AlertaPreco, "ativo">>,
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("alertas_preco")
    .update({ ativo: patch.ativo })
    .eq("user_id", userId)
    .eq("id", alertaId);

  if (error) console.warn("[sync] cloudUpdateAlert:", error.message);
}

export async function cloudDeleteAlert(userId: string, alertaId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("alertas_preco")
    .delete()
    .eq("user_id", userId)
    .eq("id", alertaId);

  if (error) console.warn("[sync] cloudDeleteAlert:", error.message);
}

export async function syncSavedIfLoggedIn(): Promise<void> {
  const userId = await getLoggedUserId();
  if (!userId) return;
  const saved = await fetchSavedFromCloud(userId);
  useSavedStore.getState().setFromSync(saved);
}

export async function syncAlertsIfLoggedIn(): Promise<void> {
  const userId = await getLoggedUserId();
  if (!userId) return;
  const alertas = await fetchAlertsFromCloud(userId);
  useAlertsStore.getState().setFromSync(alertas);
}
