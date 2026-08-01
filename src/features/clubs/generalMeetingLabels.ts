import type {
  BoardSeatType,
  BoardTitle,
  BoardType,
  GeneralMeetingType,
} from "@/shared/types";

export const GENERAL_MEETING_TYPE_LABELS: Record<GeneralMeetingType, string> = {
  ordinary: "Olağan",
  extraordinary: "Olağanüstü",
};

export const BOARD_TYPE_LABELS: Record<BoardType, string> = {
  management: "Yönetim kurulu",
  audit: "Denetleme kurulu",
};

export const BOARD_SEAT_TYPE_LABELS: Record<BoardSeatType, string> = {
  principal: "Asil",
  alternate: "Yedek",
};

export const BOARD_TITLE_LABELS: Record<BoardTitle, string> = {
  president: "Başkan",
  vice_president: "Başkan Yardımcısı",
  secretary: "Sekreter",
  treasurer: "Sayman",
  member: "Üye",
};

const TITLE_ORDER: BoardTitle[] = [
  "president",
  "vice_president",
  "secretary",
  "treasurer",
  "member",
];

export function compareBoardTitles(a: BoardTitle, b: BoardTitle): number {
  return TITLE_ORDER.indexOf(a) - TITLE_ORDER.indexOf(b);
}

export function quorumRequiredCount(memberCount: number, quorumPercent: number): number {
  return memberCount > 0 ? Math.ceil((memberCount * quorumPercent) / 100) : 0;
}
