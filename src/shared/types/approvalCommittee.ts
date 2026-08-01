// Onay kurulları — GET/POST/PATCH /api/admin/universities/:uid/approval-committees
import type { SafeUser } from "./user";

export interface ApprovalCommitteeMember {
  userId: string;
  user: SafeUser;
}

export interface ApprovalCommittee {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members: ApprovalCommitteeMember[];
}

export interface CreateApprovalCommitteeDto {
  name: string;
  memberUserIds: string[];
  isActive?: boolean;
}

export interface UpdateApprovalCommitteeDto {
  name?: string;
  memberUserIds?: string[];
  isActive?: boolean;
}

export type CommitteeVoteValue = "approve" | "reject";

export interface CommitteeVoteDto {
  vote: CommitteeVoteValue;
  reason?: string;
}

export interface CommitteeVoteRow {
  voterUserId: string;
  vote: CommitteeVoteValue;
  reason: string | null;
  votedAt: string;
  voter?: SafeUser | null;
}

/** Başvuru detayında gömülü kurul oy durumu (admin — bireysel oylar dahil). */
export interface CommitteeApprovalTally {
  committeeId: string;
  committeeName: string;
  memberCount: number;
  /** Backend eşiği — bazen `requiredApprovals` olarak gelir. */
  threshold?: number;
  requiredApprovals?: number;
  approveCount: number;
  rejectCount: number;
  notVotedCount: number;
  votes: CommitteeVoteRow[];
  /** Kurul üyesi çağıran için mevcut oy; üye değilse alan yok. */
  myVote?: CommitteeVoteRow | null;
}

/** Öğrenci yüzeyinde gömülü özet — bireysel oylar yok. */
export interface CommitteeApprovalTallyStudent {
  committeeId: string;
  committeeName: string;
  memberCount: number;
  threshold?: number;
  requiredApprovals?: number;
  approveCount: number;
  rejectCount: number;
  notVotedCount: number;
}

export interface CommitteeVoteResult {
  finalized: boolean;
  decision?: "approved" | "rejected";
  tally: CommitteeApprovalTally;
}
