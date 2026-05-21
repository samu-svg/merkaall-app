export type Promocao = {
  id: string;
  external_id: string | null;
  titulo: string;
  descricao: string | null;
  preco_original: number;
  preco_desconto: number;
  percentual_desconto: number;
  foto_url: string | null;
  link_afiliado: string;
  categoria: string | null;
  avaliacao: number | null;
  aprovada: boolean;
  criada_em: string;
  expires_at?: string | null;
  frete_gratis?: boolean;
};

export type AlertaPreco = {
  id: string;
  titulo: string;
  categoria: string | null;
  precoMaximo: number;
  ativo: boolean;
  criadoEm: string;
};

export type FiltrosAtivos = {
  categoria: string;
  freteGratis: boolean;
  descontoMinimo: number;
  precoMax: number | null;
  ordenacao: 'desconto' | 'preco' | 'avaliacao' | 'recente';
};

export const FILTROS_PADRAO: FiltrosAtivos = {
  categoria: 'Todas',
  freteGratis: false,
  descontoMinimo: 0,
  precoMax: null,
  ordenacao: 'desconto',
};

export const CATEGORIA_TODAS = "Todas";

export const TODAS_AS_CATEGORIAS = [
  "Tecnologia",
  "Roupas e Moda",
  "Calçados",
  "Casa e Decoração",
  "Eletrodomésticos",
  "Beleza",
  "Esportes",
  "Brinquedos",
  "Alimentos",
  "Livros",
  "Automotivo",
] as const;

export const ICONES_CATEGORIA: Record<string, string> = {
  [CATEGORIA_TODAS]:    "🏷️",
  Tecnologia:           "💻",
  "Roupas e Moda":      "👕",
  Calçados:             "👟",
  "Casa e Decoração":   "🏠",
  Eletrodomésticos:     "🔌",
  Beleza:               "💄",
  Esportes:             "⚽",
  Brinquedos:           "🧸",
  Alimentos:            "🍎",
  Livros:               "📚",
  Automotivo:           "🚗",
};
