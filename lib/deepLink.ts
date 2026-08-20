const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

export function parsePromoId(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  try {
    const parsed = new URL(url);
    const queryId = parsed.searchParams.get('id');
    if (queryId && UUID_RE.test(queryId)) return queryId;

    const segments = parsed.pathname.split('/').filter(Boolean);
    const promoIdx = segments.findIndex((s) => s.toLowerCase() === 'promo');
    if (promoIdx >= 0 && segments[promoIdx + 1] && UUID_RE.test(segments[promoIdx + 1])) {
      return segments[promoIdx + 1];
    }

    const last = segments[segments.length - 1];
    if (last && UUID_RE.test(last)) return last;
  } catch {
    const match = url.match(UUID_RE);
    if (match) return match[0];
  }

  return null;
}
