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
  loja?: string | null;
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
  precoMaximo: number | null;
  descontoMinimo: number;
  ativo: boolean;
  criadoEm: string;
};

export type NovoAlertaInput = {
  titulo: string;
  precoMaximo?: number | null;
  descontoMinimo?: number;
  ativo?: boolean;
};

export type PerfilUsuario = {
  id: string;
  email: string | null;
  nome: string | null;
  avatar_url: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type FiltrosAtivos = {
  categoria: string;
  freteGratis: boolean;
  descontoMinimo: number;
  precoMin: number;
  precoMax: number;
  categorias: string[];
  ordenacao: 'desconto' | 'preco' | 'avaliacao' | 'recente';
};

export const PRECO_MIN_PADRAO = 0;
export const PRECO_MAX_PADRAO = 2000;
export const DESCONTO_MAX_PADRAO = 90;

export const FILTROS_PADRAO: FiltrosAtivos = {
  categoria: 'Todas',
  freteGratis: false,
  descontoMinimo: 0,
  precoMin: PRECO_MIN_PADRAO,
  precoMax: PRECO_MAX_PADRAO,
  categorias: [],
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
  "Saúde",
  "Pets",
  "Papelaria",
  "Bebês",
  "Ferramentas",
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
  Saúde:                "💊",
  Pets:                 "🐾",
  Papelaria:            "✏️",
  Bebês:                "👶",
  Ferramentas:          "🔧",
};
