import { promoMatchesAlert } from '@/lib/alerts';
import type { AlertaPreco, Promocao } from '@/lib/types';

const basePromo: Promocao = {
  id: '1',
  external_id: null,
  titulo: 'Fone Bluetooth JBL',
  descricao: null,
  preco_original: 200,
  preco_desconto: 99,
  percentual_desconto: 50,
  foto_url: null,
  link_afiliado: 'https://loja.com',
  categoria: 'Eletrônicos',
  avaliacao: 4.5,
  aprovada: true,
  criada_em: new Date().toISOString(),
};

const baseAlerta: AlertaPreco = {
  id: 'a1',
  titulo: 'fone',
  categoria: null,
  precoMaximo: null,
  descontoMinimo: 0,
  ativo: true,
  criadoEm: new Date().toISOString(),
};

describe('promoMatchesAlert', () => {
  it('combina por termo no título', () => {
    expect(promoMatchesAlert(basePromo, baseAlerta)).toBe(true);
  });

  it('combina por termo na categoria', () => {
    expect(
      promoMatchesAlert(basePromo, { ...baseAlerta, titulo: 'eletrônicos' }),
    ).toBe(true);
  });

  it('rejeita quando texto não combina', () => {
    expect(
      promoMatchesAlert(basePromo, { ...baseAlerta, titulo: 'geladeira' }),
    ).toBe(false);
  });

  it('rejeita quando preço excede precoMaximo', () => {
    expect(
      promoMatchesAlert(basePromo, { ...baseAlerta, precoMaximo: 50 }),
    ).toBe(false);
  });

  it('rejeita quando desconto é menor que descontoMinimo', () => {
    expect(
      promoMatchesAlert(basePromo, { ...baseAlerta, descontoMinimo: 60 }),
    ).toBe(false);
  });

  it('rejeita alerta inativo', () => {
    expect(
      promoMatchesAlert(basePromo, { ...baseAlerta, ativo: false }),
    ).toBe(false);
  });

  it('rejeita promoção não aprovada', () => {
    expect(
      promoMatchesAlert({ ...basePromo, aprovada: false }, baseAlerta),
    ).toBe(false);
  });
});
