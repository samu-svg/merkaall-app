import type { Promocao } from '@/lib/types';

const MAX_GALERIA = 6;

const JUNK_IN_PATH =
  /(?:^|\/)(?:48x48|64x64|96x96|128x128|220x220|350x350|1500x128|1500x64|1920x64|banner|sprite|icon|logo|avatar|placeholder|loading|badge|arrow|star-empty|payment|trust|shipping|coupon|review-thumb)(?:\.|\/|$)/i;

const ML_PRODUCT =
  /^https?:\/\/(?:http2\.)?mlstatic\.com\/D_[A-Za-z0-9_-]+-[A-Z]+\.(?:webp|jpg|jpeg|png)/i;

const SHOPEE_PRODUCT =
  /^https?:\/\/(?:cf\.shopee\.com\.br|down-[a-z0-9-]+\.img\.shopee\.com\.br)\/file\/[a-zA-Z0-9_-]+/i;

type LojaHint = Promocao['loja'];

function normalizeImageUrl(url: string): string {
  const u = url.trim();
  return u.startsWith('//') ? `https:${u}` : u;
}

function aeImageKey(url: string): string | null {
  const kf = url.match(/\/kf\/([A-Za-z0-9]+)/i);
  if (kf) return kf[1].toLowerCase();
  const media = url.match(/aliexpress-media\.com\/[^/]+\/([A-Za-z0-9]+)/i);
  if (media) return media[1].toLowerCase();
  return null;
}

export function isProductImageUrl(url: string, loja?: LojaHint): boolean {
  const u = normalizeImageUrl(url);
  if (!u.startsWith('http')) return false;

  let path = '';
  try {
    path = new URL(u).pathname.toLowerCase();
  } catch {
    return false;
  }

  if (JUNK_IN_PATH.test(path) || JUNK_IN_PATH.test(u)) return false;

  if (loja === 'Mercado Livre' || (!loja && u.includes('mlstatic.com'))) {
    return ML_PRODUCT.test(u);
  }

  if (loja === 'Shopee' || (!loja && u.includes('shopee') && u.includes('/file/'))) {
    if (u.includes('deo.shopeemobile.com') || path.includes('assets/')) return false;
    return SHOPEE_PRODUCT.test(u);
  }

  if (
    loja === 'AliExpress' ||
    (!loja && (u.includes('alicdn.com') || u.includes('aliexpress-media.com')))
  ) {
    if (/\d+x\d+/i.test(u)) return false;
    if (u.includes('aliexpress-media.com')) {
      return /\.(jpg|jpeg|png|webp)(\?|$)/i.test(u);
    }
    if (u.includes('alicdn.com')) {
      if (/\/kf\/[^/]+\/[^/]+\./i.test(u)) return false;
      return /\/kf\/[A-Za-z0-9]+(?:[A-Za-z0-9])?\.(?:jpg|jpeg|webp)(\?|$)/i.test(u);
    }
    return false;
  }

  return false;
}

export function filterProductUrls(
  urls: string[],
  loja?: LojaHint,
  limit = MAX_GALERIA,
): string[] {
  const seenUrls = new Set<string>();
  const seenKeys = new Set<string>();
  const out: string[] = [];

  for (const raw of urls) {
    const u = normalizeImageUrl(raw);
    if (!isProductImageUrl(u, loja)) continue;
    const key =
      loja === 'AliExpress' || u.includes('alicdn') ? aeImageKey(u) ?? u : u;
    if (seenKeys.has(key) || seenUrls.has(u)) continue;
    seenKeys.add(key);
    seenUrls.add(u);
    out.push(u);
    if (out.length >= limit) break;
  }
  return out;
}

function parseFotosUrlsRaw(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
      }
    } catch {
      if (raw.trim()) return [raw.trim()];
    }
  }
  return [];
}

export function parseFotosUrls(raw: unknown, loja?: LojaHint): string[] {
  return filterProductUrls(parseFotosUrlsRaw(raw), loja);
}

/** Lista de URLs únicas para galeria (capa primeiro). */
export function getPromoFotos(
  promo: Pick<Promocao, 'foto_url' | 'fotos_urls' | 'loja'>,
): string[] {
  const loja = promo.loja ?? undefined;
  const fromArray = parseFotosUrls(promo.fotos_urls, loja);
  const capa = promo.foto_url?.trim() ?? '';
  const merged = capa
    ? [capa, ...fromArray.filter((u) => u !== capa)]
    : fromArray;
  return filterProductUrls(merged, loja);
}

/** URL da capa para cards do feed (usa fotos_urls quando foto_url estiver vazia). */
export function getPromoCapa(promo: Pick<Promocao, 'foto_url' | 'fotos_urls'>): string | null {
  const fotos = getPromoFotos(promo);
  return fotos[0] ?? null;
}

/** Garante foto_url e fotos_urls coerentes após leitura do Supabase ou cache local. */
export function normalizePromocao<T extends Record<string, unknown>>(row: T): Promocao {
  const loja =
    typeof row.loja === 'string' ? (row.loja as Promocao['loja']) : undefined;
  const fotos = parseFotosUrls(row.fotos_urls, loja);
  const capaRaw = typeof row.foto_url === 'string' ? row.foto_url.trim() : '';
  const capa = capaRaw || fotos[0] || null;
  const galeria = filterProductUrls(
    capa ? [capa, ...fotos.filter((u) => u !== capa)] : fotos,
    loja,
  );

  return {
    ...(row as unknown as Promocao),
    foto_url: capa,
    fotos_urls: galeria.length > 0 ? galeria : null,
  };
}

/** Descontos acima disso tendem a ser preço "De" inflado pelas lojas. */
export const DESCONTO_PERCENTUAL_MAX_CONFIAVEL = 85;

/** Razão preço original ÷ preço atual acima disso indica promoção enganosa. */
export const PRECO_RATIO_MAX_CONFIAVEL = 8;

/** Mantenha em sync com supabase_desconto_suspeito_migration.sql */

export function isDescontoSuspeito(
  promo: Pick<Promocao, 'preco_original' | 'preco_desconto' | 'percentual_desconto'>,
): boolean {
  const { preco_original, preco_desconto, percentual_desconto } = promo;
  if (preco_desconto <= 0) return true;
  if (preco_original <= preco_desconto) return true;
  if (percentual_desconto >= DESCONTO_PERCENTUAL_MAX_CONFIAVEL) return true;
  if (preco_original / preco_desconto > PRECO_RATIO_MAX_CONFIAVEL) return true;
  return false;
}

export function filterPromocoesConfiaveis<T extends Promocao>(promos: T[]): T[] {
  return promos.filter((p) => !isDescontoSuspeito(p));
}

export function calcEconomia(promo: Pick<Promocao, 'preco_original' | 'preco_desconto'>): number {
  return Math.max(0, promo.preco_original - promo.preco_desconto);
}

export function formatRelativeCriadaEm(criadaEm: string): string {
  const diffMs = Date.now() - new Date(criadaEm).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay >= 30) {
    const months = Math.floor(diffDay / 30);
    return months === 1 ? 'há 1 mês' : `há ${months} meses`;
  }
  if (diffDay >= 1) return diffDay === 1 ? 'há 1 dia' : `há ${diffDay} dias`;
  if (diffHour >= 1) return diffHour === 1 ? 'há 1 hora' : `há ${diffHour} horas`;
  if (diffMin >= 1) return diffMin === 1 ? 'há 1 minuto' : `há ${diffMin} minutos`;
  return 'agora mesmo';
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function descricaoUtil(promo: Pick<Promocao, 'titulo' | 'descricao'>): string | null {
  const desc = promo.descricao?.trim();
  if (!desc) return null;
  if (normalizeText(desc) === normalizeText(promo.titulo)) return null;
  return desc;
}

const EXPIRA_EM_BREVE_MS = 48 * 60 * 60 * 1000;

export function isExpiringSoon(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff > 0 && diff <= EXPIRA_EM_BREVE_MS;
}

export function descricaoFallbackBullets(promo: Promocao): string[] {
  const bullets: string[] = [];
  const desconto = Math.round(promo.percentual_desconto);
  if (desconto > 0) bullets.push(`${desconto}% de desconto`);
  if (promo.categoria) bullets.push(`Categoria: ${promo.categoria}`);
  if (promo.loja) bullets.push(`Vendido em ${promo.loja}`);
  if (promo.frete_gratis) bullets.push('Frete grátis');
  if (bullets.length === 0) bullets.push('Confira condições e disponibilidade no site da loja.');
  return bullets;
}
