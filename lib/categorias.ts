import { TODAS_AS_CATEGORIAS } from '@/lib/types';

const CATEGORIAS_VALIDAS = new Set<string>(TODAS_AS_CATEGORIAS);

/** Nomes do Mercado Livre → categorias do app. */
export const MAPA_CATEGORIAS_ML: Record<string, string> = {
  'Eletrônicos, Áudio e Vídeo': 'Tecnologia',
  Informática: 'Tecnologia',
  'Celulares e Telefones': 'Tecnologia',
  Games: 'Tecnologia',
  'Câmeras e Acessórios': 'Tecnologia',
  'Instrumentos Musicais': 'Tecnologia',
  'Esportes e Fitness': 'Esportes',
  'Calçados, Roupas e Bolsas': 'Roupas e Moda',
  'Casa, Móveis e Decoração': 'Casa e Decoração',
  'Beleza e Cuidado Pessoal': 'Beleza',
  'Brinquedos e Hobbies': 'Brinquedos',
  'Livros, Revistas e Comics': 'Livros',
  'Acessórios para Veículos': 'Automotivo',
  Agro: 'Alimentos',
  'Alimentos e Bebidas': 'Alimentos',
  'Arte, Papelaria e Armarinho': 'Papelaria',
  Eletrodomésticos: 'Eletrodomésticos',
  'Festas e Lembrancinhas': 'Casa e Decoração',
  Construção: 'Casa e Decoração',
  Ferramentas: 'Ferramentas',
  'Joias e Relógios': 'Roupas e Moda',
  Bebês: 'Bebês',
  'Pet Shop': 'Pets',
  Saúde: 'Saúde',
  'Indústria e Comércio': 'Casa e Decoração',
};

export function normalizarCategoria(categoria: unknown): string | null {
  if (categoria == null) return null;
  if (typeof categoria !== 'string') return null;

  const trimmed = categoria.trim();
  if (!trimmed) return null;
  if (CATEGORIAS_VALIDAS.has(trimmed)) return trimmed;

  const mapeada = MAPA_CATEGORIAS_ML[trimmed];
  if (mapeada && CATEGORIAS_VALIDAS.has(mapeada)) return mapeada;

  return null;
}
