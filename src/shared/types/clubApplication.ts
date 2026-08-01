// Kulüp kurma başvurusu — revizyon, geçmiş ve onay zinciri tipleri
// (FRONTEND_YONETIM.md §5.2, FRONTEND_CLUBS.md §6)
import type { CommitteeApprovalTally, CommitteeApprovalTallyStudent } from "./approvalCommittee";
import type { SafeUser } from "./user";

export type ApplicationStatus = "pending" | "approved" | "rejected" | "revision_requested";

export type ApplicationApprovalStatus = ApplicationStatus;

export type ClubApplicationEventType =
  | "revision_requested"
  | "resubmitted"
  | "approved"
  | "rejected"
  | "appeal_submitted"
  | "appeal_upheld"
  | "appeal_dismissed";

export type ClubApplicationAppealStatus = "pending" | "upheld" | "dismissed";

export interface ClubApplicationAppeal {
  status: ClubApplicationAppealStatus;
  reason: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
  reviewedBy: SafeUser | null;
}

export interface ClubApplicationChecklistItem {
  key: string;
  label: string;
  required: boolean;
  checked: boolean;
  note: string | null;
  checkedAt: string | null;
  checkedBy: SafeUser | null;
}

export interface ClubApplicationChecklist {
  items: ClubApplicationChecklistItem[];
  requireChecklistForApproval: boolean;
}

/** Başvuru detayına eklenen inceleme/itiraz alanları (T4.1). */
export interface ClubApplicationReviewFields {
  rejectionReason: string | null;
  appealDeadline: string | null;
  canAppeal: boolean;
  appeal: ClubApplicationAppeal | null;
}

export interface ClubApplicationRevisionRequest {
  step: number;
  note: string;
  requestedAt: string;
  requestedBy: SafeUser;
}

export interface ClubApplicationApproval {
  step: number;
  stepKind?: "role_sequential" | "committee_majority";
  committeeId?: string | null;
  /** Global RBAC rol adı veya `club_approver`; kurul kademesinde null olabilir. */
  approverRole: string | null;
  status: ApplicationApprovalStatus;
  approverId: string | null;
  approver: SafeUser | null;
  reviewedAt: string | null;
  note: string | null;
  /** Kurul kademesinde gömülü oy durumu; öğrenci yanıtında bireysel oylar yok. */
  committeeTally?: CommitteeApprovalTally | CommitteeApprovalTallyStudent | null;
}

export interface ClubApplicationEvent {
  id: string;
  step: number;
  eventType: ClubApplicationEventType;
  note: string | null;
  proposedName: string | null;
  description: string | null;
  createdAt: string;
  actor: SafeUser | null;
}

export interface ClubApplicationHistory {
  applicationId: string;
  revisionRequestCount: number;
  events: ClubApplicationEvent[];
}
