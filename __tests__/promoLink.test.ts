import {
  buildPromoAppLink,
  buildPromoShareLinks,
  buildPromoUniversalLink,
} from '@/lib/promoLink';

const SAMPLE_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('promoLink', () => {
  it('buildPromoUniversalLink gera URL HTTPS', () => {
    expect(buildPromoUniversalLink(SAMPLE_UUID)).toBe(
      `https://merkaall.com/promo/${SAMPLE_UUID}`,
    );
  });

  it('buildPromoAppLink gera deep link do app', () => {
    expect(buildPromoAppLink(SAMPLE_UUID)).toBe(
      `merkaall://promo/${SAMPLE_UUID}`,
    );
  });

  it('buildPromoShareLinks retorna ambos os links', () => {
    expect(buildPromoShareLinks(SAMPLE_UUID)).toEqual({
      universal: `https://merkaall.com/promo/${SAMPLE_UUID}`,
      app: `merkaall://promo/${SAMPLE_UUID}`,
    });
  });
});
