export const PASSWORD_ROTATION_DAYS = 90;

export function isPasswordExpired(changedAt: Date | string | null | undefined): boolean {
  if (!changedAt) return false;
  const then = typeof changedAt === "string" ? new Date(changedAt) : changedAt;
  if (Number.isNaN(then.getTime())) return true;
  const ageMs = Date.now() - then.getTime();
  return ageMs > PASSWORD_ROTATION_DAYS * 24 * 60 * 60 * 1000;
}
