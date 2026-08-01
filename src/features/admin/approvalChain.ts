// Kulüp başvuru onay zinciri — frontend UX (backend: club-application-chain.core.ts)
import { approverRoleLabel } from "@/features/admin/labels";
import type { ClubApplicationApproval } from "@/shared/types";

export function findCurrentApprovalStep(
  approvals: ClubApplicationApproval[]
): ClubApplicationApproval | null {
  const sorted = [...approvals].sort((a, b) => a.step - b.step);
  for (const row of sorted) {
    if (row.status === "rejected") return null;
    if (row.status === "revision_requested") return null;
    if (row.status === "pending") {
      const priorOk = sorted.filter((s) => s.step < row.step).every((s) => s.status === "approved");
      return priorOk ? row : null;
    }
  }
  return null;
}

function isLegacySingleStepAdvisorRole(approverRole: string, approvalStepCount: number): boolean {
  return approverRole === "advisor" && approvalStepCount === 1;
}

const KNOWN_CHAIN_TOKENS = new Set([
  "club_approver",
  "advisor",
  "student_affairs",
  "university_admin",
  "academic_affairs",
  "content_moderator",
  "auditor",
]);

export function canActorDecideApprovalStep(
  approverRole: string,
  approvalStepCount: number,
  roleNames: string[],
  hasClubApprove: boolean
): boolean {
  if (approverRole === "club_approver") return hasClubApprove;
  if (isLegacySingleStepAdvisorRole(approverRole, approvalStepCount)) return hasClubApprove;
  if (!KNOWN_CHAIN_TOKENS.has(approverRole)) return hasClubApprove;
  return roleNames.includes(approverRole);
}

function decisionHolderPhrase(approverRole: string): string {
  if (approverRole === "club_approver") return "kulüp onay yetkilisinde";
  if (approverRole === "advisor") return "danışmanda";
  if (approverRole === "student_affairs") return "SKS'de";
  return `${approverRoleLabel(approverRole)} rolünde`;
}

export interface ApplicationDecisionState {
  currentStep: ClubApplicationApproval | null;
  canDecide: boolean;
  disabledReason: string | null;
}

export function getApplicationDecisionState(
  approvals: ClubApplicationApproval[] | undefined,
  roleNames: string[],
  hasClubApprove: boolean
): ApplicationDecisionState {
  const stepCount = approvals?.length ?? 0;

  if (!approvals || approvals.length === 0) {
    return {
      currentStep: null,
      canDecide: hasClubApprove,
      disabledReason: hasClubApprove ? null : "Bu adımın kararı kulüp onay yetkilisinde.",
    };
  }

  const current = findCurrentApprovalStep(approvals);
  if (!current?.approverRole) {
    return { currentStep: current, canDecide: false, disabledReason: null };
  }

  if (canActorDecideApprovalStep(current.approverRole, stepCount, roleNames, hasClubApprove)) {
    return { currentStep: current, canDecide: true, disabledReason: null };
  }

  const sorted = [...approvals].sort((a, b) => a.step - b.step);
  for (const row of sorted) {
    if (row.step <= current.step || row.status !== "pending" || !row.approverRole) continue;
    if (canActorDecideApprovalStep(row.approverRole, stepCount, roleNames, hasClubApprove)) {
      return {
        currentStep: current,
        canDecide: false,
        disabledReason: "Önce önceki onay kademesi tamamlanmalı.",
      };
    }
  }

  return {
    currentStep: current,
    canDecide: false,
    disabledReason: `Bu adımın kararı ${decisionHolderPhrase(current.approverRole)}.`,
  };
}

export const APPROVAL_STATUS_LABELS: Record<ClubApplicationApproval["status"], string> = {
  pending: "Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  revision_requested: "Revizyon istendi",
};
