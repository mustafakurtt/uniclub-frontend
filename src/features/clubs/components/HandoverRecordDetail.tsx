import { useMutation, useQuery } from "@tanstack/react-query";
import {
  BOARD_SEAT_TYPE_LABELS,
  BOARD_TITLE_LABELS,
} from "@/features/clubs/generalMeetingLabels";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { exportErrorHint, generateExport, getExportCatalog } from "@/features/exports/api/exports";
import { formatActivityDateTime } from "@/features/activities/formatActivityDateTime";
import { useTenantTimezone } from "@/features/auth/hooks/useTenantTimezone";
import { getErrorMessage } from "@/shared/api/client";
import { Icon } from "@/shared/ui/Icon";
import type { HandoverBoardSnapshot, HandoverRecord } from "@/shared/types";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function BoardSnapshotTable({
  title,
  rows,
}: {
  title: string;
  rows: HandoverBoardSnapshot[];
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h4 className="mb-2 text-sm font-bold text-slate-900">{title}</h4>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
        {rows.map((row) => (
          <li
            key={`${row.userId}-${row.boardType}-${row.seatType}-${row.title}`}
            className="px-4 py-2.5 text-sm"
          >
            <span className="font-semibold text-slate-900">{row.fullName ?? "Üye"}</span>
            <span className="text-slate-500">
              {" "}
              · {BOARD_TITLE_LABELS[row.title]} ({BOARD_SEAT_TYPE_LABELS[row.seatType]})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface Props {
  universityId: string;
  record: HandoverRecord;
}

export default function HandoverRecordDetail({ universityId, record }: Props) {
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
    (catalogQuery.data?.some((r) => r.id === "club-handover-minutes") ?? false);

  const downloadMutation = useMutation({
    mutationFn: () =>
      generateExport(universityId, "club-handover-minutes", { handoverId: record.id }, "pdf"),
    onSuccess: (file) => triggerDownload(file.blob, file.filename),
  });

  const downloadErrorHint = exportErrorHint(
    (downloadMutation.error as Error & { code?: string | null })?.code ?? null,
  );

  const items = record.transferredItems;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          Kayıt: {formatActivityDateTime(record.createdAt, timezone)}
          {record.recordedBy &&
            ` · ${record.recordedBy.firstName} ${record.recordedBy.lastName}`}
        </p>
        {minutesAvailable && (
          <button
            type="button"
            className="btn-secondary text-xs"
            disabled={downloadMutation.isPending}
            onClick={() => downloadMutation.mutate()}
          >
            <Icon name="audit" size={13} />
            {downloadMutation.isPending ? "İndiriliyor…" : "Tutanak PDF"}
          </button>
        )}
      </div>

      {downloadMutation.isError && (
        <div className="alert-error text-sm">
          {getErrorMessage(downloadMutation.error, "Tutanak indirilemedi.")}
          {downloadErrorHint && <p className="mt-1 text-xs">{downloadErrorHint}</p>}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <BoardSnapshotTable title="Devreden kurul" rows={record.outgoingBoard} />
        <BoardSnapshotTable title="Devralan kurul" rows={record.incomingBoard} />
      </div>

      <div>
        <h4 className="mb-2 text-sm font-bold text-slate-900">Devredilen sorumluluklar</h4>
        <ul className="space-y-1 text-sm text-slate-600">
          <li>
            Bekleyen katılım istekleri:{" "}
            <span className="font-semibold">{items.pendingJoinRequestUserIds.length}</span>
          </li>
          <li>
            Devam eden etkinlikler:{" "}
            <span className="font-semibold">{items.ongoingActivityIds.length}</span>
          </li>
          <li>
            Aktif danışmanlar:{" "}
            <span className="font-semibold">{items.advisorUserIds.length}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
