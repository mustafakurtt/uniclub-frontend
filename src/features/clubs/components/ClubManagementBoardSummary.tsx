import {
  BOARD_TITLE_LABELS,
  BOARD_TYPE_LABELS,
  compareBoardTitles,
} from "@/features/clubs/generalMeetingLabels";
import { useActiveBoardMembers } from "@/features/clubs/hooks/useActiveBoardMembers";
import { Icon } from "@/shared/ui/Icon";
import type { BoardType, GeneralMeetingBoardMember } from "@/shared/types";

function memberName(m: GeneralMeetingBoardMember): string {
  if (!m.user) return "Bilinmeyen üye";
  return `${m.user.firstName} ${m.user.lastName}`;
}

function BoardChips({
  members,
  boardType,
}: {
  members: GeneralMeetingBoardMember[];
  boardType: BoardType;
}) {
  const principals = members
    .filter((m) => m.boardType === boardType && m.seatType === "principal")
    .sort((a, b) => compareBoardTitles(a.title, b.title));

  if (principals.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {BOARD_TYPE_LABELS[boardType]}
      </span>
      {principals.map((m) => (
        <span key={m.id} className="chip gap-1.5">
          <Icon name="role" size={13} className="text-brand-600" />
          <span className="font-semibold">{BOARD_TITLE_LABELS[m.title]}:</span>
          {memberName(m)}
        </span>
      ))}
    </div>
  );
}

interface Props {
  clubId: string;
  enabled?: boolean;
}

/** Kulüp künyesinde güncel yönetim kurulu özeti (asil üyeler, unvanlı). */
export default function ClubManagementBoardSummary({ clubId, enabled = true }: Props) {
  const { activeMembers, isLoading, hasMeetings } = useActiveBoardMembers(clubId, enabled);

  if (isLoading || !hasMeetings) return null;

  const management = activeMembers.filter((m) => m.boardType === "management");
  if (management.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <BoardChips members={activeMembers} boardType="management" />
    </div>
  );
}
