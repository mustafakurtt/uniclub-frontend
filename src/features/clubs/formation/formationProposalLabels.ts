import type { FormationProposalStatus } from "@/shared/types";

export const FORMATION_PROPOSAL_STATUS_LABELS: Record<FormationProposalStatus, string> = {
  collecting_support: "Destek toplanıyor",
  submitted: "SKS incelemesinde",
  withdrawn: "Geri çekildi",
  expired: "Süresi doldu",
};

export const FORMATION_PROPOSAL_STATUS_CHIP: Record<FormationProposalStatus, string> = {
  collecting_support: "bg-brand-50 text-brand-700 border-brand-100",
  submitted: "bg-green-50 text-green-700 border-green-100",
  withdrawn: "bg-slate-100 text-slate-600 border-slate-200",
  expired: "bg-slate-100 text-slate-500 border-slate-200",
};

/** `expiresAt` → kalan tam gün (0 = bugün sona eriyor). */
export function formationDaysRemaining(expiresAt: string): number {
  const end = new Date(expiresAt);
  end.setHours(23, 59, 59, 999);
  const diffMs = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / 86_400_000));
}

export function formationDaysRemainingLabel(expiresAt: string): string {
  const days = formationDaysRemaining(expiresAt);
  if (days === 0) return "Bugün son gün";
  if (days === 1) return "1 gün kaldı";
  return `${days} gün kaldı`;
}
