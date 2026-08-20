/**
 * Edge Function: envia push via Expo para tokens registrados.
 *
 * Deploy:
 *   supabase functions deploy send-push --no-verify-jwt
 *   (ou com verify-jwt e Authorization Bearer no cron/trigger)
 *
 * Secrets (Dashboard → Edge Functions → Secrets):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Body POST (JSON):
 *   { "promocao_id": "uuid" }           — processa uma promo
 *   { "scan_recent": true }             — varre promos novas (~2h)
 *   { "promocao_id": "...", "preco_anterior": 99.9, "is_update": true }
 *
 * Agendamento: ver supabase_push_migration.sql (pg_cron + pg_net).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { unauthorizedResponse, webhookAuthorized } from '../_shared/webhook_auth.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const PROMO_DISCOUNT_THRESHOLD = 50;
const RECENT_WINDOW_HOURS = 2;
const DESCONTO_PERCENTUAL_MAX_CONFIAVEL = 85;
const PRECO_RATIO_MAX_CONFIAVEL = 8;

type TipoNotificacao = 'nova_promo' | 'queda_preco' | 'alerta';

type PromocaoRow = {
  id: string;
  titulo: string;
  preco_original: number;
  preco_desconto: number;
  percentual_desconto: number;
  categoria: string | null;
  aprovada: boolean;
  criada_em: string;
};

function isDescontoSuspeito(promo: Pick<PromocaoRow, 'preco_original' | 'preco_desconto' | 'percentual_desconto'>): boolean {
  const { preco_original, preco_desconto, percentual_desconto } = promo;
  if (preco_desconto <= 0) return true;
  if (preco_original <= preco_desconto) return true;
  if (percentual_desconto >= DESCONTO_PERCENTUAL_MAX_CONFIAVEL) return true;
  if (preco_original / preco_desconto > PRECO_RATIO_MAX_CONFIAVEL) return true;
  return false;
}

type AlertaRow = {
  id: string;
  titulo: string;
  categoria: string | null;
  preco_maximo: number | null;
  desconto_minimo: number;
  ativo: boolean;
};

type TokenRow = {
  device_id: string;
  user_id: string | null;
  expo_token: string;
  platform: string | null;
};

type RequestPayload = {
  promocao_id?: string;
  scan_recent?: boolean;
  preco_anterior?: number;
  is_update?: boolean;
};

type NotifyDecision = {
  tipo: TipoNotificacao;
  titulo: string;
  corpo: string;
};

function promoMatchesAlert(promo: PromocaoRow, alerta: AlertaRow): boolean {
  if (!alerta.ativo || !promo.aprovada) return false;

  const termo = alerta.titulo.toLowerCase().trim();
  const titulo = promo.titulo.toLowerCase();
  const categoria = (promo.categoria ?? '').toLowerCase();

  const matchTexto =
    titulo.includes(termo) ||
    categoria.includes(termo) ||
    (categoria.length > 0 && termo.includes(categoria));

  if (!matchTexto) return false;
  if (alerta.preco_maximo != null && promo.preco_desconto > Number(alerta.preco_maximo)) return false;
  if (alerta.desconto_minimo > 0 && promo.percentual_desconto < Number(alerta.desconto_minimo)) return false;

  return true;
}

function buildNovaPromo(promo: PromocaoRow): NotifyDecision {
  const desconto = Math.round(promo.percentual_desconto);
  return {
    tipo: 'nova_promo',
    titulo: '🔥 Nova promoção!',
    corpo: `${promo.titulo} com ${desconto}% OFF por R$${promo.preco_desconto.toFixed(2)}`,
  };
}

function buildQuedaPreco(promo: PromocaoRow): NotifyDecision {
  return {
    tipo: 'queda_preco',
    titulo: '📉 Preço caiu!',
    corpo: `${promo.titulo} agora por R$${promo.preco_desconto.toFixed(2)}`,
  };
}

function buildAlerta(alertaTitulo: string, promo: PromocaoRow): NotifyDecision {
  const desconto = Math.round(promo.percentual_desconto);
  return {
    tipo: 'alerta',
    titulo: '🔔 Alerta encontrado!',
    corpo: `"${alertaTitulo}": ${promo.titulo} por R$${promo.preco_desconto.toFixed(2)} (${desconto}% OFF)`,
  };
}

async function decideNotification(
  supabase: ReturnType<typeof createClient>,
  token: TokenRow,
  promo: PromocaoRow,
  payload: RequestPayload,
): Promise<NotifyDecision | null> {
  if (!promo.aprovada || isDescontoSuspeito(promo)) return null;

  if (token.user_id) {
    const { data: alertas } = await supabase
      .from('alertas_preco')
      .select('id, titulo, categoria, preco_maximo, desconto_minimo, ativo')
      .eq('user_id', token.user_id)
      .eq('ativo', true);

    for (const alerta of (alertas ?? []) as AlertaRow[]) {
      if (promoMatchesAlert(promo, alerta)) {
        return buildAlerta(alerta.titulo, promo);
      }
    }

    if (payload.is_update && payload.preco_anterior != null) {
      const precoAnterior = Number(payload.preco_anterior);
      if (precoAnterior > promo.preco_desconto) {
        const { data: salvo } = await supabase
          .from('promocoes_salvas')
          .select('promocao_id')
          .eq('user_id', token.user_id)
          .eq('promocao_id', promo.id)
          .maybeSingle();

        if (salvo) return buildQuedaPreco(promo);
      }
    }
  }

  if (promo.percentual_desconto > PROMO_DISCOUNT_THRESHOLD) {
    const criada = new Date(promo.criada_em).getTime();
    const recentCutoff = Date.now() - RECENT_WINDOW_HOURS * 60 * 60 * 1000;
    if (criada >= recentCutoff || payload.promocao_id) {
      return buildNovaPromo(promo);
    }
  }

  return null;
}

async function alreadyNotified(
  supabase: ReturnType<typeof createClient>,
  token: TokenRow,
  promoId: string,
  tipo: TipoNotificacao,
): Promise<boolean> {
  let query = supabase
    .from('notificacoes')
    .select('id')
    .eq('promocao_id', promoId)
    .eq('tipo', tipo)
    .limit(1);

  if (token.user_id) {
    query = query.eq('user_id', token.user_id);
  } else {
    query = query.eq('device_id', token.device_id).is('user_id', null);
  }

  const { data } = await query;
  return (data?.length ?? 0) > 0;
}

async function sendExpoPush(
  expoToken: string,
  titulo: string,
  corpo: string,
  promoId: string,
): Promise<boolean> {
  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      to: expoToken,
      title: titulo,
      body: corpo,
      data: { promoId },
      sound: 'default',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[send-push] Expo API:', res.status, text);
    return false;
  }
  return true;
}

async function fetchPromos(
  supabase: ReturnType<typeof createClient>,
  payload: RequestPayload,
): Promise<PromocaoRow[]> {
  if (payload.promocao_id) {
    const { data, error } = await supabase
      .from('promocoes')
      .select('id, titulo, preco_original, preco_desconto, percentual_desconto, categoria, aprovada, criada_em')
      .eq('id', payload.promocao_id)
      .eq('aprovada', true)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data || isDescontoSuspeito(data as PromocaoRow)) return [];
    return [data as PromocaoRow];
  }

  if (payload.scan_recent) {
    const since = new Date(Date.now() - RECENT_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('promocoes')
      .select('id, titulo, preco_original, preco_desconto, percentual_desconto, categoria, aprovada, criada_em')
      .eq('aprovada', true)
      .gte('criada_em', since)
      .order('criada_em', { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    return ((data ?? []) as PromocaoRow[]).filter((p) => !isDescontoSuspeito(p));
  }

  return [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  if (!webhookAuthorized(req)) {
    return unauthorizedResponse();
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase env' }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  let payload: RequestPayload = {};
  try {
    payload = (await req.json()) as RequestPayload;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  if (!payload.promocao_id && !payload.scan_recent) {
    return new Response(
      JSON.stringify({ error: 'Informe promocao_id ou scan_recent: true' }),
      { status: 400 },
    );
  }

  try {
    const promos = await fetchPromos(supabase, payload);
    if (promos.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, promos: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: tokens, error: tokensError } = await supabase
      .from('device_push_tokens')
      .select('device_id, user_id, expo_token, platform');

    if (tokensError) throw new Error(tokensError.message);

    let sent = 0;

    for (const promo of promos) {
      for (const token of (tokens ?? []) as TokenRow[]) {
        const decision = await decideNotification(supabase, token, promo, payload);
        if (!decision) continue;

        if (await alreadyNotified(supabase, token, promo.id, decision.tipo)) continue;

        const { error: insertError } = await supabase.from('notificacoes').insert({
          device_id: token.device_id,
          user_id: token.user_id,
          tipo: decision.tipo,
          promocao_id: promo.id,
          titulo: decision.titulo,
          corpo: decision.corpo,
        });

        if (insertError) {
          console.error('[send-push] insert notificacao:', insertError.message);
          continue;
        }

        const ok = await sendExpoPush(token.expo_token, decision.titulo, decision.corpo, promo.id);
        if (ok) sent += 1;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, sent, promos: promos.length, tokens: tokens?.length ?? 0 }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[send-push]', message);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
