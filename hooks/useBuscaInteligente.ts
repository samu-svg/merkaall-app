import { useState, useCallback, useRef } from 'react';

import { DESCONTO_MAX_PADRAO } from '@/lib/types';
import { filterPromocoesConfiaveis, normalizePromocao } from '@/lib/promoFormat';
import { getSupabaseClient } from '@/lib/supabase';
import type { Promocao } from '@/lib/types';

const SINONIMOS: Record<string, string[]> = {
  celular: ['smartphone', 'iphone', 'samsung', 'xiaomi', 'motorola', 'android', 'galaxy'],
  fone: ['headphone', 'earphone', 'earbuds', 'airpods', 'headset', 'auricular'],
  notebook: ['laptop', 'computador portatil', 'macbook', 'ultrabook'],
  tv: ['televisor', 'televisão', 'smart tv', 'qled', 'oled', 'monitor'],
  tablet: ['ipad', 'galaxy tab'],
  console: ['playstation', 'ps5', 'xbox', 'nintendo', 'switch'],
  camera: ['câmera', 'câmera fotográfica', 'dslr', 'mirrorless', 'gopro'],
  geladeira: ['refrigerador', 'frigorífico'],
  fogão: ['cooktop', 'forno', 'micro-ondas'],
  aspirador: ['robô aspirador', 'roomba', 'vacuum'],
  cama: ['colchão', 'travesseiro', 'edredom', 'jogo de cama'],
  tenis: ['tênis', 'sneaker', 'nike', 'adidas', 'new balance', 'puma', 'vans'],
  roupa: ['camiseta', 'calça', 'vestido', 'blusa', 'camisa', 'shorts'],
  cafe: ['café', 'cappuccino', 'nespresso'],
  chocolate: ['cacau', 'trufas'],
  streaming: ['netflix', 'disney', 'spotify', 'amazon prime', 'hbo', 'globoplay'],
  internet: ['fibra', 'banda larga', 'wi-fi', 'wifi', 'roteador'],
};

const INDICE_REVERSO: Record<string, string[]> = {};
for (const [chave, sinonimos] of Object.entries(SINONIMOS)) {
  for (const sin of sinonimos) {
    INDICE_REVERSO[sin] = INDICE_REVERSO[sin] || [];
    INDICE_REVERSO[sin].push(chave, ...sinonimos.filter((s) => s !== sin));
  }
  INDICE_REVERSO[chave] = sinonimos;
}

function expandirTermos(termoBruto: string): string[] {
  const termo = termoBruto.toLowerCase().trim();
  const termos = new Set<string>([termo]);
  (SINONIMOS[termo] ?? []).forEach((t) => termos.add(t));
  (INDICE_REVERSO[termo] ?? []).forEach((t) => termos.add(t));
  for (const chave of Object.keys(SINONIMOS)) {
    if (chave.includes(termo) || termo.includes(chave)) {
      termos.add(chave);
      SINONIMOS[chave].forEach((t) => termos.add(t));
    }
  }
  return Array.from(termos);
}

function removerAcentos(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

interface ResultadoBusca {
  promocoes: Promocao[];
  carregando: boolean;
  erro: string | null;
  termosExpandidos: string[];
  totalEncontrado: number;
}

export function useBuscaInteligente() {
  const [estado, setEstado] = useState<ResultadoBusca>({
    promocoes: [],
    carregando: false,
    erro: null,
    termosExpandidos: [],
    totalEncontrado: 0,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buscar = useCallback(async (termoBruto: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const termo = termoBruto.trim();
    if (!termo || termo.length < 2) {
      setEstado((prev) => ({ ...prev, promocoes: [], termosExpandidos: [], totalEncontrado: 0 }));
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setEstado((prev) => ({ ...prev, carregando: true, erro: null }));
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          setEstado((prev) => ({
            ...prev,
            carregando: false,
            erro: 'Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env',
          }));
          return;
        }

        const termosExpandidos = expandirTermos(termo);

        const { data: dataFTS, error: erroFTS } = await supabase.rpc('buscar_promocoes', {
          termo: removerAcentos(termo),
          limite: 50,
          offset_val: 0,
        });

        if (!erroFTS && dataFTS && dataFTS.length > 0) {
          const promocoes = filterPromocoesConfiaveis(
            (dataFTS as Record<string, unknown>[]).map(normalizePromocao),
          ).filter((p) => p.percentual_desconto <= DESCONTO_MAX_PADRAO);
          setEstado({
            promocoes,
            carregando: false,
            erro: null,
            termosExpandidos,
            totalEncontrado: promocoes.length,
          });
          return;
        }

        const filtrosOR = termosExpandidos
          .map(
            (t) =>
              `titulo.ilike.%${removerAcentos(t)}%,descricao.ilike.%${removerAcentos(t)}%,categoria.ilike.%${removerAcentos(t)}%,loja.ilike.%${removerAcentos(t)}%`,
          )
          .join(',');

        const { data, error } = await supabase
          .from('promocoes')
          .select('*')
          .eq('aprovada', true)
          .lte('percentual_desconto', DESCONTO_MAX_PADRAO)
          .or(filtrosOR)
          .order('criada_em', { ascending: false })
          .limit(50);

        if (error) throw error;
        const promocoes = filterPromocoesConfiaveis(
          (data ?? []).map((row) => normalizePromocao(row as Record<string, unknown>)),
        );
        setEstado({
          promocoes,
          carregando: false,
          erro: null,
          termosExpandidos,
          totalEncontrado: promocoes.length,
        });
      } catch (err: unknown) {
        console.error('[Busca] Erro:', err);
        setEstado((prev) => ({
          ...prev,
          carregando: false,
          erro: 'Não foi possível buscar. Tente novamente.',
        }));
      }
    }, 350);
  }, []);

  const limpar = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setEstado({
      promocoes: [],
      carregando: false,
      erro: null,
      termosExpandidos: [],
      totalEncontrado: 0,
    });
  }, []);

  return { ...estado, buscar, limpar };
}
