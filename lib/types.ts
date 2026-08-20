export type Promocao = {
  id: string;
  external_id: string | null;
  titulo: string;
  descricao: string | null;
  preco_original: number;
  preco_desconto: number;
  percentual_desconto: number;
  foto_url: string | null;
  /** Galeria completa; quando vazio, use foto_url. Preencher no scraper ou via migração SQL. */
  fotos_urls?: string[] | null;
  link_afiliado: string;
  loja?: string | null;
  categoria: string | null;
  avaliacao: number | null;
  aprovada: boolean;
  criada_em: string;
  expires_at?: string | null;
  frete_gratis?: boolean;
  /** Preenchido pela RPC buscar_promocoes (ranking FTS). */
  relevancia?: number;
};

export type TipoNotificacao = 'nova_promo' | 'queda_preco' | 'alerta';

export type Notificacao = {
  id: string;
  tipo: TipoNotificacao;
  promocaoId: string | null;
  titulo: string;
  corpo: string;
  lida: boolean;
  criadoEm: string;
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
  loja: string;
  categoria: string;
  freteGratis: boolean;
  descontoMaximo: number;
  precoMin: number;
  precoMax: number;
  categorias: string[];
  ordenacao: 'desconto' | 'preco' | 'avaliacao' | 'recente';
};

export const LOJA_TODAS = 'Todas';

export const LOJAS_FEED = ['Mercado Livre', 'Shopee', 'AliExpress'] as const;

export const PRECO_MIN_PADRAO = 0;
export const PRECO_MAX_PADRAO = 2000;
export const DESCONTO_MAX_PADRAO = 50;

export const FILTROS_PADRAO: FiltrosAtivos = {
  loja: LOJA_TODAS,
  categoria: 'Todas',
  freteGratis: false,
  descontoMaximo: DESCONTO_MAX_PADRAO,
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
