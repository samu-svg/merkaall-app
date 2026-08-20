import { APP_SCHEME, APP_WEB_URL } from '@/constants/brand';

export function buildPromoUniversalLink(promoId: string): string {
  return `${APP_WEB_URL}/promo/${promoId}`;
}

export function buildPromoAppLink(promoId: string): string {
  return `${APP_SCHEME}://promo/${promoId}`;
}

export function buildPromoShareLinks(promoId: string): { universal: string; app: string } {
  return {
    universal: buildPromoUniversalLink(promoId),
    app: buildPromoAppLink(promoId),
  };
}
