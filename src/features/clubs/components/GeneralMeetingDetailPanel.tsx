import { useMutation, useQuery } from "@tanstack/react-query";
import { formatActivityDateTime } from "@/features/activities/formatActivityDateTime";
import {
  GENERAL_MEETING_TYPE_LABELS,
  quorumRequiredCount,
} from "@/features/clubs/generalMeetingLabels";
import GeneralMeetingBoardSection from "@/features/clubs/components/GeneralMeetingBoardSection";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useTenantTimezone } from "@/features/auth/hooks/useTenantTimezone";
import { exportErrorHint, generateExport, getExportCatalog } from "@/features/exports/api/exports";
import { getErrorMessage } from "@/shared/api/client";
import { Icon } from "@/shared/ui/Icon";
import type { GeneralMeetingDetail } from "@/shared/types";

function userName(user: { firstName: string; lastName: string }): string {
  return `${user.firstName} ${user.lastName}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

interface Props {
  universityId: string;
  meeting: GeneralMeetingDetail;
}

export default function GeneralMeetingDetailPanel({ universityId, meeting }: Props) {
  const timezone = useTenantTimezone();
  const { hasPermission } = useAuth();
  const canExport = hasPermission("university.export.generate");

  const catalogQuery = useQuery({
    queryKey: ["exports", universityId, "catalog"],
    queryFn: () => getExportCatalog(universityId),
    enabled: canExport,
    retry: false,
  });

  const minutesAvailable =
    canExport &&
    !catalogQuery.isError &&
    (catalogQuery.data?.some((r) => r.id === "general-meeting-minutes") ?? false);

  const downloadMutation = useMutation({
    mutationFn: () =>
      generateExport(universityId, "general-meeting-minutes", { meetingId: meeting.id }, "pdf"),
    onSuccess: (file) => triggerDownload(file.blob, file.filename),
  });

  const downloadErrorHint = exportErrorHint(
    (downloadMutation.error as Error & { code?: string | null })?.code ?? null
  );

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
        <div className="flex flex-wrap items-center gap-2">
          {minutesAvailable && (
            <button
              type="button"
              className="btn-secondary text-sm"
              disabled={downloadMutation.isPending}
              onClick={() => downloadMutation.mutate()}
            >
              <Icon name="audit" size={14} />
              {downloadMutation.isPending ? "İndiriliyor…" : "Tutanağı indir"}
            </button>
          )}
          <span
            className={`chip ${meeting.quorumMet ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"}`}
          >
            Yeter sayı: {meeting.attendeeCount}/{meeting.quorumRequired}
            {meeting.quorumMet ? " ✓" : ""}
          </span>
        </div>
      </div>

      {downloadMutation.isError && (
        <div className="alert-error text-sm">
          {getErrorMessage(downloadMutation.error, "Tutanak indirilemedi.")}
          {downloadErrorHint && <p className="mt-1 text-xs">{downloadErrorHint}</p>}
        </div>
      )}

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
