import {
  DESCONTO_PERCENTUAL_MAX_CONFIAVEL,
  filterPromocoesConfiaveis,
  isDescontoSuspeito,
  isExpiringSoon,
} from '@/lib/promoFormat';
import type { Promocao } from '@/lib/types';

const HOUR_MS = 60 * 60 * 1000;

function promo(partial: Partial<Promocao> & Pick<Promocao, 'preco_original' | 'preco_desconto' | 'percentual_desconto'>): Promocao {
  return {
    id: '1',
    external_id: null,
    titulo: 'Teste',
    descricao: null,
    foto_url: null,
    link_afiliado: 'https://example.com',
    categoria: null,
    avaliacao: null,
    aprovada: true,
    criada_em: new Date().toISOString(),
    ...partial,
  };
}

describe('isDescontoSuspeito', () => {
  it('rejeita desconto percentual exagerado (ex.: R$ 4000 → R$ 30)', () => {
    expect(
      isDescontoSuspeito(promo({ preco_original: 4000, preco_desconto: 30, percentual_desconto: 99 })),
    ).toBe(true);
  });

  it('rejeita quando percentual >= limite confiável', () => {
    expect(
      isDescontoSuspeito(
        promo({ preco_original: 200, preco_desconto: 20, percentual_desconto: DESCONTO_PERCENTUAL_MAX_CONFIAVEL }),
      ),
    ).toBe(true);
  });

  it('rejeita razão preço original / atual muito alta', () => {
    expect(
      isDescontoSuspeito(promo({ preco_original: 900, preco_desconto: 100, percentual_desconto: 70 })),
    ).toBe(true);
  });

  it('aceita promoção com desconto realista', () => {
    expect(
      isDescontoSuspeito(promo({ preco_original: 200, preco_desconto: 150, percentual_desconto: 25 })),
    ).toBe(false);
  });

  it('aceita desconto forte mas dentro do limite', () => {
    expect(
      isDescontoSuspeito(promo({ preco_original: 500, preco_desconto: 100, percentual_desconto: 80 })),
    ).toBe(false);
  });
});

describe('filterPromocoesConfiaveis', () => {
  it('remove promoções suspeitas da lista', () => {
    const lista = [
      promo({ id: 'a', preco_original: 4000, preco_desconto: 30, percentual_desconto: 99 }),
      promo({ id: 'b', preco_original: 200, preco_desconto: 150, percentual_desconto: 25 }),
    ];
    expect(filterPromocoesConfiaveis(lista).map((p) => p.id)).toEqual(['b']);
  });
});

describe('isExpiringSoon', () => {
  it('retorna false sem expires_at', () => {
    expect(isExpiringSoon(null)).toBe(false);
    expect(isExpiringSoon(undefined)).toBe(false);
  });

  it('retorna false quando já expirou', () => {
    const past = new Date(Date.now() - HOUR_MS).toISOString();
    expect(isExpiringSoon(past)).toBe(false);
  });

  it('retorna false quando falta mais de 48h', () => {
    const future = new Date(Date.now() + 72 * HOUR_MS).toISOString();
    expect(isExpiringSoon(future)).toBe(false);
  });

  it('retorna true quando falta até 48h', () => {
    const soon = new Date(Date.now() + 24 * HOUR_MS).toISOString();
    expect(isExpiringSoon(soon)).toBe(true);
  });

  it('retorna true no limite de 48h', () => {
    const limit = new Date(Date.now() + 48 * HOUR_MS).toISOString();
    expect(isExpiringSoon(limit)).toBe(true);
  });
});
