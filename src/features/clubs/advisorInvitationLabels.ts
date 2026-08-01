/** Davet `expiresAt` alanından kalan tam gün (yanıtta yoksa kullanma). */
export function invitationDaysRemaining(expiresAt: string): number {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / 86_400_000));
}

export function invitationDaysRemainingLabel(expiresAt: string): string {
  const days = invitationDaysRemaining(expiresAt);
  if (days === 0) return "Bugün son gün";
  if (days === 1) return "1 gün kaldı";
  return `${days} gün kaldı`;
}
