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

/** PATCH committee-vote yanıtı — çoğunluk sayıları backend'den gelir. */
export interface CommitteeVoteTally {
  memberCount: number;
  threshold: number;
  approveCount: number;
  rejectCount: number;
  /** Oy kullanan üye sayısı (bilet sayısı). */
  votes: number;
}

export interface CommitteeVoteResult {
  finalized: boolean;
  decision?: "approved" | "rejected";
  tally: CommitteeVoteTally;
}

/** Oturum içi oy satırı — kalıcı GET ucu olmadığı için yalnızca oy verdikten sonra dolar. */
export interface CommitteeVoteRow {
  voterUserId: string;
  vote: CommitteeVoteValue;
  reason: string | null;
  votedAt: string;
  voter?: SafeUser | null;
}
