// Kulüp paneli — GET /api/clubs/:clubId/dashboard, handover, current-board (FRONTEND_CLUBS.md §7).
import type { BoardSeatType, BoardTitle, BoardType, GeneralMeetingType } from "./generalMeeting";
import type { SafeUser } from "./user";

export interface ClubDashboard {
  memberCount: number;
  pendingJoinRequests: number;
  upcomingActivityCount: number;
  announcementCount: number;
}

export interface CurrentBoardMember {
  id: string;
  userId: string;
  boardType: BoardType;
  seatType: BoardSeatType;
  title: BoardTitle;
  user: SafeUser | null;
}

export interface CurrentBoardGroup {
  principal: CurrentBoardMember[];
  alternate: CurrentBoardMember[];
}

export interface CurrentBoard {
  management: CurrentBoardGroup;
  audit: CurrentBoardGroup;
}

export interface HandoverBoardSnapshot {
  userId: string;
  boardType: BoardType;
  seatType: BoardSeatType;
  title: BoardTitle;
  fullName: string | null;
}

export interface HandoverTransferredItems {
  pendingJoinRequestUserIds: string[];
  ongoingActivityIds: string[];
  advisorUserIds: string[];
}

export interface HandoverRecord {
  id: string;
  clubId: string;
  handoverAt: string;
  academicTerm: { id: string; name: string } | null;
  generalMeeting: {
    id: string;
    meetingType: GeneralMeetingType;
    heldAt: string;
    location: string;
  } | null;
  recordedBy: SafeUser | null;
  outgoingBoard: HandoverBoardSnapshot[];
  incomingBoard: HandoverBoardSnapshot[];
  transferredItems: HandoverTransferredItems;
  createdAt: string;
}

export interface CreateHandoverRecordDto {
  generalMeetingId: string;
  handoverAt?: string;
}
