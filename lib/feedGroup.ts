import type { Promocao } from '@/lib/types';

export type FeedDiaSecao = {
  label: string;
  key: string;
  data: Promocao[];
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function labelDia(criadaEm: string): string {
  const date = new Date(criadaEm);
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatHora(criadaEm: string): string {
  return new Date(criadaEm).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Agrupa promoções por dia; ordem cronológica dentro de cada dia (mais antigo primeiro). */
export function agruparFeedPorDia(promos: Promocao[]): FeedDiaSecao[] {
  const map = new Map<string, Promocao[]>();

  for (const promo of promos) {
    const label = labelDia(promo.criada_em);
    const list = map.get(label) ?? [];
    list.push(promo);
    map.set(label, list);
  }

  const secoes: FeedDiaSecao[] = [];
  for (const [label, items] of map) {
    items.sort(
      (a, b) => new Date(a.criada_em).getTime() - new Date(b.criada_em).getTime(),
    );
    secoes.push({
      label,
      key: label,
      data: items,
    });
  }

  secoes.sort((a, b) => {
    const ta = new Date(a.data[0]?.criada_em ?? 0).getTime();
    const tb = new Date(b.data[0]?.criada_em ?? 0).getTime();
    return ta - tb;
  });

  return secoes;
}

/** Inverte seções e itens para SectionList invertida (recentes embaixo). */
export function inverterSecoesFeed(secoes: FeedDiaSecao[]): FeedDiaSecao[] {
  return [...secoes]
    .reverse()
    .map((sec) => ({
      ...sec,
      data: [...sec.data].reverse(),
    }));
}
