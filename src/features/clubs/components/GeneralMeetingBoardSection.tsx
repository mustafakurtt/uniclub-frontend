import {
  BOARD_SEAT_TYPE_LABELS,
  BOARD_TITLE_LABELS,
  BOARD_TYPE_LABELS,
  compareBoardTitles,
} from "@/features/clubs/generalMeetingLabels";
import type { BoardType, GeneralMeetingBoardMember } from "@/shared/types";

function memberName(m: GeneralMeetingBoardMember): string {
  if (!m.user) return "Bilinmeyen üye";
  return `${m.user.firstName} ${m.user.lastName}`;
}

function SeatGroup({
  members,
  seatType,
}: {
  members: GeneralMeetingBoardMember[];
  seatType: GeneralMeetingBoardMember["seatType"];
}) {
  const rows = members
    .filter((m) => m.seatType === seatType)
    .sort((a, b) => compareBoardTitles(a.title, b.title));

  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">Kayıt yok.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((m) => (
        <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{memberName(m)}</p>
            {m.user?.email && <p className="text-xs text-slate-400">{m.user.email}</p>}
          </div>
          <span className="chip shrink-0 text-[11px]">{BOARD_TITLE_LABELS[m.title]}</span>
        </li>
      ))}
    </ul>
  );
}

function BoardSection({
  boardType,
  members,
}: {
  boardType: BoardType;
  members: GeneralMeetingBoardMember[];
}) {
  const filtered = members.filter((m) => m.boardType === boardType);
  if (filtered.length === 0) return null;

  return (
    <section className="space-y-4">
      <h4 className="text-sm font-bold text-slate-900">{BOARD_TYPE_LABELS[boardType]}</h4>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white/80 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            {BOARD_SEAT_TYPE_LABELS.principal}
          </p>
          <SeatGroup members={filtered} seatType="principal" />
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white/80 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            {BOARD_SEAT_TYPE_LABELS.alternate}
          </p>
          <SeatGroup members={filtered} seatType="alternate" />
        </div>
      </div>
    </section>
  );
}

interface Props {
  members: GeneralMeetingBoardMember[];
  /** Yalnızca aktif üyeleri göster (detay ekranında `endedAt` dolu olanları gizle). */
  activeOnly?: boolean;
}

export default function GeneralMeetingBoardSection({ members, activeOnly = false }: Props) {
  const visible = activeOnly ? members.filter((m) => !m.endedAt) : members;
  if (visible.length === 0) {
    return <p className="text-sm text-slate-500">Bu toplantıda kurul seçimi kaydedilmemiş.</p>;
  }

  return (
    <div className="space-y-6">
      <BoardSection boardType="management" members={visible} />
      <BoardSection boardType="audit" members={visible} />
    </div>
  );
}
