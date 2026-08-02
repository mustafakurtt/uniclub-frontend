import type { CurrentBoard, CurrentBoardMember, GeneralMeetingBoardMember } from "@/shared/types";

/** `current-board` yanıtını `GeneralMeetingBoardSection` ile paylaşımlı forma çevirir. */
export function currentBoardToMeetingMembers(board: CurrentBoard): GeneralMeetingBoardMember[] {
  const rows: CurrentBoardMember[] = [
    ...board.management.principal,
    ...board.management.alternate,
    ...board.audit.principal,
    ...board.audit.alternate,
  ];
  return rows.map((m) => ({
    id: m.id,
    userId: m.userId,
    user: m.user,
    boardType: m.boardType,
    seatType: m.seatType,
    title: m.title,
    endedAt: null,
  }));
}

export function boardHasMembers(board: CurrentBoard): boolean {
  return currentBoardToMeetingMembers(board).length > 0;
}
