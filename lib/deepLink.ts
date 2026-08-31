const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

export type AuthCallbackResult =
  | { type: "session"; accessToken: string; refreshToken: string }
  | { type: "code"; code: string }
  | { type: "error"; message: string }
  | { type: "confirmed" };

function readParam(search: URLSearchParams, hash: URLSearchParams, key: string): string | null {
  return search.get(key) || hash.get(key);
}

function isAuthCallbackUrl(parsed: URL): boolean {
  const path = `${parsed.hostname}${parsed.pathname}`.toLowerCase();
  return (
    path.includes("auth/callback") ||
    path.includes("auth/confirm") ||
    (parsed.protocol === "merkaall:" && parsed.hostname.toLowerCase() === "auth")
  );
}

export function parseAuthCallback(url: string | null | undefined): AuthCallbackResult | null {
  if (!url?.trim()) return null;

  try {
    const parsed = new URL(url);
    const search = parsed.searchParams;
    const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
    const accessToken = readParam(search, hash, "access_token");
    const refreshToken = readParam(search, hash, "refresh_token");
    const code = readParam(search, hash, "code");
    const tokenHash = readParam(search, hash, "token_hash");
    const otpType = readParam(search, hash, "type");
    const rawError =
      readParam(search, hash, "error_description") || readParam(search, hash, "error");
    const looksLikeAuth =
      isAuthCallbackUrl(parsed) ||
      Boolean(accessToken || code || tokenHash || otpType === "signup" || otpType === "email");

    if (!looksLikeAuth) return null;

    if (rawError) {
      return {
        type: "error",
        message: decodeURIComponent(rawError.replace(/\+/g, " ")),
      };
    }

    if (accessToken && refreshToken) {
      return { type: "session", accessToken, refreshToken };
    }

    if (code) return { type: "code", code };

    if (tokenHash || otpType === "signup" || otpType === "email" || isAuthCallbackUrl(parsed)) {
      return { type: "confirmed" };
    }
  } catch {
    return null;
  }

  return null;
}

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
