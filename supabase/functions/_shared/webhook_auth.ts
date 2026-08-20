export function secretsEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function webhookAuthorized(req: Request): boolean {
  const secret = Deno.env.get("WEBHOOK_SECRET") ?? "";
  if (!secret) return false;
  const header = req.headers.get("x-webhook-secret") ?? "";
  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  return secretsEqual(header, secret) || secretsEqual(bearer, secret);
}

export function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
