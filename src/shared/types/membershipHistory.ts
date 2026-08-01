// Kulüp üyelik tarihçesi — docs/architecture/FRONTEND_CLUBS.md §7.6
import type { ClubRole } from "./club";
import type { SafeUser } from "./user";

export type MembershipHistoryEventType =
  | "joined"
  | "join_rejected"
  | "left"
  | "removed"
  | "role_changed";

export interface MembershipHistoryTermRef {
  id: string;
  name: string;
}

export interface MembershipHistoryEvent {
  id: string;
  eventType: MembershipHistoryEventType;
  role: ClubRole | null;
  previousRole: ClubRole | null;
  occurredAt: string;
  academicTermId: string | null;
  academicTerm: MembershipHistoryTermRef | null;
  user: SafeUser | null;
  actor: SafeUser | null;
}

export interface MembershipHistoryPage {
  items: MembershipHistoryEvent[];
  nextCursor: string | null;
}
