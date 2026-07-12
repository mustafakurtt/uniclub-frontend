import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getAuditLogs } from "@/features/admin/api/audit";
import { getErrorMessage } from "@/shared/api/client";
import { permissionLabel } from "@/features/admin/labels";
import EmptyState from "@/shared/ui/EmptyState";
import RequireUniversity from "@/features/admin/components/RequireUniversity";
import type { AuditLog } from "@/shared/types";

// Denetim izi (docs/DENETIM_VE_HATA.md §1) — okuma `audit.view`. Tablo append-only;
// burada yalnızca görüntüleme var, hiçbir düzenleme/silme aksiyonu yok.
const PAGE_SIZE = 50;

function statusBadgeClass(status: number): string {
  if (status >= 500) return "bg-red-50 text-red-700 border-red-100";
  if (status === 403 || status === 401) return "bg-amber-50 text-amber-700 border-amber-100";
  if (status >= 400) return "bg-orange-50 text-orange-700 border-orange-100";
  return "bg-green-50 text-green-700 border-green-100";
}

function AuditLogRow({ log }: { log: AuditLog }) {
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusBadgeClass(log.status)}`}
          >
            {log.status}
          </span>
          <span className="truncate text-sm font-bold text-slate-900">{permissionLabel(log.action)}</span>
          <span className="truncate text-xs font-mono text-slate-400">
            {log.method} {log.path}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-slate-500">
          {log.actor ? `${log.actor.firstName} ${log.actor.lastName} · ${log.actor.email}` : log.actorId}
          {log.targetType && (
            <>
              {" "}
              → <span className="font-semibold text-slate-600">{log.targetType}</span>
              {log.targetId && <span className="text-slate-400"> #{log.targetId}</span>}
            </>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-[11px] text-slate-400">
        {log.ip && <span className="font-mono">{log.ip}</span>}
        <span>{new Date(log.createdAt).toLocaleString("tr-TR")}</span>
      </div>
    </li>
  );
}

function AuditLogList({ universityId }: { universityId: string }) {
  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState("");
  const [targetId, setTargetId] = useState("");

  const filters = {
    actorId: actorId.trim() || undefined,
    action: action.trim() || undefined,
    targetId: targetId.trim() || undefined,
  };

  const logsQuery = useInfiniteQuery({
    queryKey: ["admin", universityId, "audit", filters],
    queryFn: ({ pageParam }) =>
      getAuditLogs(universityId, { ...filters, limit: PAGE_SIZE, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const logs = logsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-6">
      {/* Filtreler — "bu kişi neler yaptı?" / "kim kullanıcı yönetti?" / "bu kayda kimler dokundu?" */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={actorId}
          onChange={(e) => setActorId(e.target.value)}
          className="input-field max-w-xs py-1.5 text-sm"
          placeholder="Aktör id (uuid)"
        />
        <input
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="input-field max-w-xs py-1.5 text-sm"
          placeholder="Yetki anahtarı (ör. user.manage)"
        />
        <input
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          className="input-field max-w-xs py-1.5 text-sm"
          placeholder="Hedef id"
        />
      </div>

      {logsQuery.isLoading ? (
        <div className="space-y-3">
          <div className="skeleton h-14 w-full" />
          <div className="skeleton h-14 w-full" />
          <div className="skeleton h-14 w-full" />
        </div>
      ) : logsQuery.isError ? (
        <div className="alert-error">{getErrorMessage(logsQuery.error, "Denetim izi yüklenemedi.")}</div>
      ) : logs.length === 0 ? (
        <EmptyState icon="audit" title="Bu filtrede kayıt yok" />
      ) : (
        <div className="card overflow-hidden p-0">
          <ul className="divide-y divide-slate-100">
            {logs.map((log) => (
              <AuditLogRow key={log.id} log={log} />
            ))}
          </ul>

          {logsQuery.hasNextPage && (
            <button
              type="button"
              onClick={() => logsQuery.fetchNextPage()}
              disabled={logsQuery.isFetchingNextPage}
              className="w-full border-t border-slate-100 py-3 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50 disabled:opacity-50"
            >
              {logsQuery.isFetchingNextPage ? "Yükleniyor..." : "Daha fazla göster"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminAudit() {
  const { hasPermission } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Denetim İzi</h1>
        <p className="mt-1 text-sm text-slate-500">
          Korunan her yazma isteği (başarılı ya da reddedilmiş) burada görünür. Kayıtlar değiştirilemez.
        </p>
      </div>

      {!hasPermission("audit.view") ? (
        <div className="alert-error">Denetim izini görüntüleme yetkin bulunmuyor.</div>
      ) : (
        <RequireUniversity>
          {(universityId) => <AuditLogList universityId={universityId} />}
        </RequireUniversity>
      )}
    </div>
  );
}
