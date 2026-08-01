// Kulüp kurma başvurusu — revizyon, geçmiş ve onay zinciri tipleri
// (FRONTEND_YONETIM.md §5.2, FRONTEND_CLUBS.md §6)
import type { SafeUser } from "./user";

export type ApplicationStatus = "pending" | "approved" | "rejected" | "revision_requested";

export type ApplicationApprovalStatus = ApplicationStatus;

export type ClubApplicationEventType =
  | "revision_requested"
  | "resubmitted"
  | "approved"
  | "rejected";

export interface ClubApplicationRevisionRequest {
  step: number;
  note: string;
  requestedAt: string;
  requestedBy: SafeUser;
}

export interface ClubApplicationApproval {
  step: number;
  /** Global RBAC rol adı veya `club_approver` (club.approve yetkisi taşıyanlar). */
  approverRole: string;
  status: ApplicationApprovalStatus;
  approverId: string | null;
  approver: SafeUser | null;
  reviewedAt: string | null;
  note: string | null;
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
