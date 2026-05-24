import type { AlertaPreco, Promocao } from '@/lib/types';
import { fmtBRL } from '@/lib/format';

export function promoMatchesAlert(promo: Promocao, alerta: AlertaPreco): boolean {
  if (!alerta.ativo || !promo.aprovada) return false;

  const termo = alerta.titulo.toLowerCase().trim();
  const titulo = promo.titulo.toLowerCase();
  const categoria = (promo.categoria ?? '').toLowerCase();

  const matchTexto =
    titulo.includes(termo) ||
    categoria.includes(termo) ||
    (categoria.length > 0 && termo.includes(categoria));

  if (!matchTexto) return false;
  if (alerta.precoMaximo != null && promo.preco_desconto > alerta.precoMaximo) return false;
  if (alerta.descontoMinimo > 0 && promo.percentual_desconto < alerta.descontoMinimo) return false;

  return true;
}

export function formatAlertCondicao(alerta: AlertaPreco): string {
  const partes: string[] = [];
  if (alerta.precoMaximo != null) partes.push(`Máx ${fmtBRL.format(alerta.precoMaximo)}`);
  if (alerta.descontoMinimo > 0) partes.push(`Mín ${alerta.descontoMinimo}% OFF`);
  return partes.length > 0 ? partes.join(' · ') : 'Sem limite de preço ou desconto';
}

export function formatAlertStatus(ativo: boolean): string {
  return ativo ? 'Ativo' : 'Inativo';
}
