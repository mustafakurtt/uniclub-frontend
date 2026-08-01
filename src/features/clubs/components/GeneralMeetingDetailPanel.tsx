import { formatActivityDateTime } from "@/features/activities/formatActivityDateTime";
import {
  GENERAL_MEETING_TYPE_LABELS,
  quorumRequiredCount,
} from "@/features/clubs/generalMeetingLabels";
import GeneralMeetingBoardSection from "@/features/clubs/components/GeneralMeetingBoardSection";
import { useTenantTimezone } from "@/features/auth/hooks/useTenantTimezone";
import { Icon } from "@/shared/ui/Icon";
import type { GeneralMeetingDetail } from "@/shared/types";

function userName(user: { firstName: string; lastName: string }): string {
  return `${user.firstName} ${user.lastName}`;
}

interface Props {
  meeting: GeneralMeetingDetail;
}

export default function GeneralMeetingDetailPanel({ meeting }: Props) {
  const timezone = useTenantTimezone();

  return (
    <div className="space-y-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-slate-900">
            {GENERAL_MEETING_TYPE_LABELS[meeting.meetingType]} genel kurul
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {formatActivityDateTime(meeting.heldAt, timezone)} · {meeting.location}
          </p>
          {meeting.academicTerm && (
            <p className="mt-1 text-xs text-slate-500">Dönem: {meeting.academicTerm.name}</p>
          )}
        </div>
        <span
          className={`chip ${meeting.quorumMet ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"}`}
        >
          Yeter sayı: {meeting.attendeeCount}/{meeting.quorumRequired}
          {meeting.quorumMet ? " ✓" : ""}
        </span>
      </div>

      <section>
        <h4 className="mb-2 text-sm font-bold text-slate-900">Alınan kararlar</h4>
        <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {meeting.decisions}
          </p>
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-sm font-bold text-slate-900">
          Katılımcılar ({meeting.attendeeCount})
        </h4>
        <ul className="flex flex-wrap gap-2">
          {meeting.attendees.map((a) => (
            <li key={a.id} className="chip gap-1.5">
              <Icon name="members" size={13} className="text-brand-600" />
              {userName(a)}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          Yeter sayı eşiği: %{meeting.quorumPercent} (
          {quorumRequiredCount(meeting.memberCount, meeting.quorumPercent)} / {meeting.memberCount}{" "}
          üye)
        </p>
      </section>

      <section>
        <h4 className="mb-3 text-sm font-bold text-slate-900">Seçilen kurullar</h4>
        <GeneralMeetingBoardSection members={meeting.boardMembers} />
      </section>

      {meeting.recordedBy && (
        <p className="text-xs text-slate-400">
          Kaydı giren: {userName(meeting.recordedBy)} ·{" "}
          {formatActivityDateTime(meeting.createdAt, timezone)}
        </p>
      )}
    </div>
  );
}
