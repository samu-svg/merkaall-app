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
