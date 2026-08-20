import type { FiltrosAtivos, Promocao } from './types';

type IntencaoProduto = {
  aliases: string[];
  boost: RegExp[];
  acessorio: RegExp[];
};

const INTENCOES: Record<string, IntencaoProduto> = {
  celular: {
    aliases: ['smartphone', 'iphone', 'android', 'samsung', 'xiaomi', 'motorola', 'galaxy', 'redmi'],
    boost: [
      /\bsmartphone\b/i,
      /\biphone\b/i,
      /\bgalaxy\s+[a-z]?\d/i,
      /\bredmi\b/i,
      /\bmotorola\b/i,
      /\bxiaomi\b/i,
      /\b\d{2,3}\s*gb\b/i,
      /\b5g\b/i,
      /\bcelular\b(?!.*\bpara\b)/i,
    ],
    acessorio: [
      /\bcarregador\b/i,
      /\bcapa\b/i,
      /\bpel[ií]cula\b/i,
      /\bvidro\b.*\btela\b/i,
      /\bcabo\b/i,
      /\bpower\s*bank\b/i,
      /\bsuporte\b/i,
      /\bindu[cç][aã]o\b/i,
      /\bcompat[ií]vel\b/i,
      /\bpara\s+celular\b/i,
      /\bpara\s+smartphone\b/i,
      /\bestojo\b/i,
      /\banel\b.*\blente\b/i,
    ],
  },
  notebook: {
    aliases: ['laptop', 'macbook', 'ultrabook'],
    boost: [/\bnotebook\b/i, /\blaptop\b/i, /\bmacbook\b/i, /\bultrabook\b/i, /\b\d{1,2}(?:ª|a)?\s*gera[cç][aã]o\b/i],
    acessorio: [
      /\bmochila\b/i,
      /\bmouse\b/i,
      /\bteclado\b/i,
      /\bsuporte\b/i,
      /\bhub\b/i,
      /\badaptador\b/i,
      /\bpara\s+notebook\b/i,
      /\bcompat[ií]vel\b/i,
      /\bpel[ií]cula\b/i,
      /\bfunda\b/i,
    ],
  },
  tv: {
    aliases: ['televisao', 'televisão', 'televisor', 'smart tv'],
    boost: [/\bsmart\s*tv\b/i, /\btelevis[aã]o\b/i, /\btelevisor\b/i, /\b\d{2,3}\s*(?:pol|")/i, /\bqled\b/i, /\boled\b/i],
    acessorio: [
      /\bsuporte\b/i,
      /\bcontrole\s+remoto\b/i,
      /\bcabo\b/i,
      /\bpara\s+tv\b/i,
      /\bcompat[ií]vel\b/i,
      /\bantena\b/i,
    ],
  },
  fone: {
    aliases: ['headphone', 'earphone', 'earbuds', 'airpods', 'headset', 'auricular'],
    boost: [/\bfone\b/i, /\bearbuds?\b/i, /\bairpods?\b/i, /\bheadphone\b/i, /\bheadset\b/i],
    acessorio: [/\bcapa\b/i, /\bestojo\b/i, /\bpara\s+fone\b/i, /\bcabo\b/i, /\bcompat[ií]vel\b/i],
  },
  tablet: {
    aliases: ['ipad'],
    boost: [/\btablet\b/i, /\bipad\b/i, /\bgalaxy\s+tab\b/i],
    acessorio: [/\bcapa\b/i, /\bteclado\b/i, /\bpara\s+tablet\b/i, /\bpara\s+ipad\b/i, /\bcompat[ií]vel\b/i],
  },
  console: {
    aliases: ['playstation', 'ps5', 'xbox', 'nintendo', 'switch'],
    boost: [/\bplaystation\b/i, /\bps[345]\b/i, /\bxbox\b/i, /\bnintendo\b/i, /\bswitch\b/i, /\bconsole\b/i],
    acessorio: [/\bcontrole\b/i, /\bjoystick\b/i, /\bcapa\b/i, /\bpara\s+ps\d\b/i, /\bcompat[ií]vel\b/i],
  },
};

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function resolverIntencao(termoBruto: string): string | null {
  const termo = normalizar(termoBruto.trim());
  if (!termo) return null;
  if (INTENCOES[termo]) return termo;
  for (const [chave, cfg] of Object.entries(INTENCOES)) {
    if (cfg.aliases.some((a) => normalizar(a) === termo)) return chave;
  }
  return null;
}

function pontuarResultado(termoBruto: string, promo: Promocao): number {
  const termo = normalizar(termoBruto.trim());
  const titulo = normalizar(promo.titulo);
  const descricao = normalizar(promo.descricao ?? '');
  const intencao = resolverIntencao(termoBruto);

  let score = (promo.relevancia ?? 0) * 100;

  if (titulo.includes(termo)) score += 18;
  if (new RegExp(`\\b${termo}\\b`).test(titulo)) score += 12;
  if (titulo.startsWith(termo)) score += 8;

  if (new RegExp(`\\bpara\\s+${termo}\\b`).test(titulo)) score -= 45;
  if (/\bcompat[ií]vel\s+com\b/.test(titulo)) score -= 30;
  if (/\bacessorio\b/.test(titulo) || /\bacessorio\b/.test(descricao)) score -= 15;

  if (intencao) {
    const cfg = INTENCOES[intencao];
    const temBoost = cfg.boost.some((r) => r.test(titulo));
    const temAcessorio = cfg.acessorio.some((r) => r.test(titulo));

    if (temBoost) score += 28;
    if (temAcessorio) score -= 40;
    if (temAcessorio && !temBoost) score -= 25;
  }

  return score;
}

export function rankearPorIntencaoBusca(termo: string, list: Promocao[]): Promocao[] {
  return [...list].sort((a, b) => pontuarResultado(termo, b) - pontuarResultado(termo, a));
}

function ordenarPromocoes(list: Promocao[], ordenacao: FiltrosAtivos['ordenacao']): Promocao[] {
  const arr = [...list];
  switch (ordenacao) {
    case 'preco':
      return arr.sort((a, b) => a.preco_desconto - b.preco_desconto);
    case 'avaliacao':
      return arr.sort((a, b) => (b.avaliacao ?? 0) - (a.avaliacao ?? 0));
    case 'recente':
      return arr.sort((a, b) => new Date(b.criada_em).getTime() - new Date(a.criada_em).getTime());
    case 'desconto':
    default:
      return arr.sort((a, b) => b.percentual_desconto - a.percentual_desconto);
  }
}

/** Na busca, o padrão é relevância/intenção — não % de desconto (evita acessórios no topo). */
export function ordenarResultadosBusca(
  termo: string,
  list: Promocao[],
  ordenacao: FiltrosAtivos['ordenacao'],
): Promocao[] {
  if (ordenacao === 'preco' || ordenacao === 'avaliacao' || ordenacao === 'recente') {
    return ordenarPromocoes(list, ordenacao);
  }
  return rankearPorIntencaoBusca(termo, list);
}
