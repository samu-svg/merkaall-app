import { parseAuthCallback, parsePromoId } from '@/lib/deepLink';

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

describe('parseAuthCallback', () => {
  it('retorna null para URL vazia ou de promoção', () => {
    expect(parseAuthCallback(null)).toBeNull();
    expect(parseAuthCallback('https://merkaall.com/promo/abc')).toBeNull();
  });

  it('lê tokens do hash (fluxo implicit)', () => {
    expect(
      parseAuthCallback(
        'merkaall://auth/callback#access_token=aaa&refresh_token=bbb',
      ),
    ).toEqual({ type: 'session', accessToken: 'aaa', refreshToken: 'bbb' });
  });

  it('lê code da query (fluxo PKCE)', () => {
    expect(parseAuthCallback('https://merkaall.com/auth/callback?code=xyz')).toEqual({
      type: 'code',
      code: 'xyz',
    });
  });

  it('lê erro de confirmação', () => {
    expect(
      parseAuthCallback(
        'https://merkaall.com/auth/callback?error=server_error&error_description=PKCE+code+verifier+not+found',
      ),
    ).toEqual({ type: 'error', message: 'PKCE code verifier not found' });
  });

  it('trata deep link merkaall://auth como confirmação', () => {
    expect(parseAuthCallback('merkaall://auth/callback')).toEqual({ type: 'confirmed' });
  });

  it('não trata URL de promoção com query error como auth', () => {
    expect(parseAuthCallback(`https://merkaall.com/promo/${SAMPLE_UUID}?error=1`)).toBeNull();
  });
});
