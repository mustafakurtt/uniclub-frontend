// Genel kurul — GET/POST /api/clubs/:clubId/general-meetings (FRONTEND_CLUBS.md §7.7)
import type { SafeUser } from "./user";

export type GeneralMeetingType = "ordinary" | "extraordinary";
export type BoardType = "management" | "audit";
export type BoardSeatType = "principal" | "alternate";
export type BoardTitle =
  | "president"
  | "vice_president"
  | "secretary"
  | "treasurer"
  | "member";

export interface GeneralMeetingTermRef {
  id: string;
  name: string;
}

export interface GeneralMeetingSummary {
  id: string;
  meetingType: GeneralMeetingType;
  heldAt: string;
  location: string;
  academicTerm: GeneralMeetingTermRef | null;
  quorumPercent: number;
  memberCount: number;
}

export interface GeneralMeetingBoardMember {
  id: string;
  userId: string;
  user: SafeUser | null;
  boardType: BoardType;
  seatType: BoardSeatType;
  title: BoardTitle;
  endedAt: string | null;
}

export interface GeneralMeetingDetail extends GeneralMeetingSummary {
  clubId: string;
  decisions: string;
  recordedBy: SafeUser | null;
  createdAt: string;
  attendeeCount: number;
  quorumRequired: number;
  quorumMet: boolean;
  attendees: SafeUser[];
  boardMembers: GeneralMeetingBoardMember[];
}

export interface BoardMemberInput {
  userId: string;
  boardType: BoardType;
  seatType: BoardSeatType;
  title: BoardTitle;
}

export interface CreateGeneralMeetingDto {
  academicTermId: string;
  meetingType: GeneralMeetingType;
  heldAt: string;
  location: string;
  decisions: string;
  attendeeUserIds: string[];
  boardMembers?: BoardMemberInput[];
}
