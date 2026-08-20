import { MIN_PASSWORD_LENGTH, validatePasswordStrength } from '@/lib/password';

describe('validatePasswordStrength', () => {
  it('rejeita senha curta', () => {
    expect(validatePasswordStrength('Abcd123')).toContain(String(MIN_PASSWORD_LENGTH));
  });

  it('aceita senha com letras e números', () => {
    expect(validatePasswordStrength('promocao2026')).toBeNull();
  });
});
