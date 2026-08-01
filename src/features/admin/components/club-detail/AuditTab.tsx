import { useInfiniteQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/features/admin/api/audit";
import { permissionLabel } from "@/features/admin/labels";
import { getErrorMessage } from "@/shared/api/client";
import EmptyState from "@/shared/ui/EmptyState";
import type { AuditLog } from "@/shared/types";

const PAGE_SIZE = 30;

function statusBadgeClass(status: number): string {
  if (status >= 500) return "bg-red-50 text-red-700 border-red-100";
  if (status === 403 || status === 401) return "bg-amber-50 text-amber-700 border-amber-100";
  if (status >= 400) return "bg-orange-50 text-orange-700 border-orange-100";
  return "bg-green-50 text-green-700 border-green-100";
}

function AuditLogRow({ log }: { log: AuditLog }) {
  return (
    <li className="flex flex-col gap-2 px-1 py-3 sm:flex-row sm:items-center sm:gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusBadgeClass(log.status)}`}
          >
            {log.status}
          </span>
          <span className="truncate text-sm font-bold text-slate-900">
            {permissionLabel(log.action)}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-slate-500">
          {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : log.actorId}
          {" · "}
          {new Date(log.createdAt).toLocaleString("tr-TR")}
        </p>
      </div>
    </li>
  );
}

interface Props {
  universityId: string;
  clubId: string;
  enabled: boolean;
}

export default function AuditTab({ universityId, clubId, enabled }: Props) {
  const logsQuery = useInfiniteQuery({
    queryKey: ["admin", universityId, "audit", { targetId: clubId }],
    queryFn: ({ pageParam }) =>
      getAuditLogs(universityId, {
        targetId: clubId,
        limit: PAGE_SIZE,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });

  const logs = logsQuery.data?.pages.flatMap((p) => p.items) ?? [];

  if (logsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-12 w-full" />
      </div>
    );
  }

  if (logsQuery.isError) {
    return (
      <div className="alert-error">{getErrorMessage(logsQuery.error, "Denetim izi yüklenemedi.")}</div>
    );
  }

  if (logs.length === 0) {
    return <EmptyState icon="audit" title="Bu kulübe ait denetim kaydı yok" />;
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-slate-100">{logs.map((log) => <AuditLogRow key={log.id} log={log} />)}</ul>
      {logsQuery.hasNextPage && (
        <button
          type="button"
          className="btn-ghost text-sm"
          disabled={logsQuery.isFetchingNextPage}
          onClick={() => logsQuery.fetchNextPage()}
        >
          {logsQuery.isFetchingNextPage ? "Yükleniyor…" : "Daha fazla göster"}
        </button>
      )}
    </div>
  );
}
