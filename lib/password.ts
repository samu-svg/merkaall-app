export const MIN_PASSWORD_LENGTH = 12;

const LETTER = /[A-Za-zÀ-ÿ]/;
const DIGIT = /\d/;

export function validatePasswordStrength(senha: string): string | null {
  if (senha.length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (!LETTER.test(senha) || !DIGIT.test(senha)) {
    return "A senha deve ter letras e números.";
  }
  return null;
}
