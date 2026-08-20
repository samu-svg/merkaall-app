import { parsePromoId } from '@/lib/deepLink';

const SAMPLE_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('parsePromoId', () => {
  it('retorna null para URL vazia ou inválida', () => {
    expect(parsePromoId(null)).toBeNull();
    expect(parsePromoId(undefined)).toBeNull();
    expect(parsePromoId('')).toBeNull();
    expect(parsePromoId('   ')).toBeNull();
    expect(parsePromoId('https://merkaall.com/')).toBeNull();
    expect(parsePromoId('not-a-url')).toBeNull();
  });

  it('extrai UUID de deep link do app', () => {
    expect(parsePromoId(`merkaall://promo/${SAMPLE_UUID}`)).toBe(SAMPLE_UUID);
  });

  it('extrai UUID de URL HTTPS com path /promo/', () => {
    expect(parsePromoId(`https://merkaall.com/promo/${SAMPLE_UUID}`)).toBe(SAMPLE_UUID);
  });

  it('extrai UUID de query ?id=', () => {
    expect(parsePromoId(`https://merkaall.com/?id=${SAMPLE_UUID}`)).toBe(SAMPLE_UUID);
  });

  it('extrai UUID do último segmento do path', () => {
    expect(parsePromoId(`https://example.com/ofertas/${SAMPLE_UUID}`)).toBe(SAMPLE_UUID);
  });

  it('extrai UUID de string sem URL válida via regex fallback', () => {
    expect(parsePromoId(`confira ${SAMPLE_UUID} agora`)).toBe(SAMPLE_UUID);
  });
});
