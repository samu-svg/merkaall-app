import { getDeviceId } from '@/lib/deviceId';
import { getSupabaseClient } from '@/lib/supabase';
import type { Notificacao, TipoNotificacao } from '@/lib/types';

const LIMITE = 50;

const TIPOS_VALIDOS: TipoNotificacao[] = ['nova_promo', 'queda_preco', 'alerta'];

function mapRow(row: Record<string, unknown>): Notificacao | null {
  const tipo = row.tipo as string;
  if (!TIPOS_VALIDOS.includes(tipo as TipoNotificacao)) return null;

  return {
    id: String(row.id),
    tipo: tipo as TipoNotificacao,
    promocaoId: row.promocao_id ? String(row.promocao_id) : null,
    titulo: String(row.titulo ?? ''),
    corpo: String(row.corpo ?? ''),
    lida: Boolean(row.lida),
    criadoEm: String(row.criado_em ?? new Date().toISOString()),
  };
}

export async function buscarNotificacoes(
  userId?: string | null,
): Promise<{ data: Notificacao[]; error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: [], error: null };

  try {
    let query = supabase
      .from('notificacoes')
      .select('id, tipo, promocao_id, titulo, corpo, lida, criado_em')
      .order('criado_em', { ascending: false })
      .limit(LIMITE);

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      const deviceId = await getDeviceId();
      query = query.eq('device_id', deviceId).is('user_id', null);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[notificacoes] buscar:', error.message);
      return { data: [], error: error.message };
    }

    const lista = (data ?? [])
      .map((row) => mapRow(row as Record<string, unknown>))
      .filter((n): n is Notificacao => n !== null);

    return { data: lista, error: null };
  } catch (err) {
    console.warn('[notificacoes] buscar:', err);
    return { data: [], error: null };
  }
}

export async function marcarNotificacaoLida(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { error } = await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
    if (error) console.warn('[notificacoes] marcarLida:', error.message);
  } catch (err) {
    console.warn('[notificacoes] marcarLida:', err);
  }
}

export async function marcarTodasNotificacoesLidas(userId?: string | null): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    let query = supabase.from('notificacoes').update({ lida: true }).eq('lida', false);

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      const deviceId = await getDeviceId();
      query = query.eq('device_id', deviceId).is('user_id', null);
    }

    const { error } = await query;
    if (error) console.warn('[notificacoes] marcarTodasLidas:', error.message);
  } catch (err) {
    console.warn('[notificacoes] marcarTodasLidas:', err);
  }
}
