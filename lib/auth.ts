import type { Session } from "@supabase/supabase-js";

import { getSupabaseClient } from "@/lib/supabase";
import { validatePasswordStrength } from "@/lib/password";
import type { PerfilUsuario } from "@/lib/types";

export type AuthResult = { ok: true } | { ok: false; error: string };

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (lower.includes("user already registered")) {
    return "Este e-mail já está cadastrado.";
  }
  if (lower.includes("password should be at least")) {
    return "A senha deve ter pelo menos 12 caracteres.";
  }
  if (lower.includes("unable to validate email address")) {
    return "Informe um e-mail válido.";
  }
  return message;
}

export async function getSession(): Promise<Session | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.warn("[auth] getSession:", error.message);
    return null;
  }
  return data.session;
}

export async function buscarPerfil(userId: string): Promise<PerfilUsuario | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, nome, avatar_url, criado_em, atualizado_em")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[auth] buscarPerfil:", error.message);
    return null;
  }
  return data as PerfilUsuario | null;
}

export async function criarPerfil(
  userId: string,
  email: string,
  nome: string,
): Promise<PerfilUsuario | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, email, nome }, { onConflict: "id" })
    .select("id, email, nome, avatar_url, criado_em, atualizado_em")
    .single();

  if (error) {
    console.warn("[auth] criarPerfil:", error.message);
    return null;
  }
  return data as PerfilUsuario;
}

export async function entrar(email: string, senha: string): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { ok: false, error: "Supabase não configurado." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { ok: false, error: mapAuthError(error.message) };
  return { ok: true };
}

export async function cadastrar(
  email: string,
  senha: string,
  nome: string,
): Promise<AuthResult & { needsConfirmation?: boolean }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { ok: false, error: "Supabase não configurado." };
  }

  const senhaErro = validatePasswordStrength(senha);
  if (senhaErro) return { ok: false, error: senhaErro };

  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome } },
  });

  if (error) return { ok: false, error: mapAuthError(error.message) };

  if (data.user && !data.session) {
    return { ok: true, needsConfirmation: true };
  }

  if (data.user) {
    await criarPerfil(data.user.id, email, nome);
  }

  return { ok: true };
}

export async function sair(): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { ok: false, error: "Supabase não configurado." };
  }

  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function atualizarNome(nome: string): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { ok: false, error: "Supabase não configurado." };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { ok: false, error: "Usuário não autenticado." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ nome })
    .eq("id", userData.user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
