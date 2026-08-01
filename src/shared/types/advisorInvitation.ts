// Danışman davet akışı — FRONTEND_CLUBS.md §10
import type { SafeUser } from "./user";

export type AdvisorInvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "cancelled";

export interface AdvisorInvitationClubRef {
  id: string;
  name: string;
  slug: string;
}

/** Admin kulüp davet listesi + akademisyen davetlerim. */
export interface ClubAdvisorInvitation {
  id: string;
  status: AdvisorInvitationStatus;
  message: string | null;
  expiresAt: string;
  createdAt: string;
  declineReason?: string | null;
  respondedAt?: string | null;
  invitee?: SafeUser | null;
  inviter?: SafeUser | null;
  club?: AdvisorInvitationClubRef | null;
}

export interface InviteClubAdvisorDto {
  userId: string;
  message?: string;
}

export interface DeclineAdvisorInvitationDto {
  reason: string;
}

export interface WithdrawAdvisorDto {
  reason: string;
}
