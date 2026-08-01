import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/features/admin/api/audit";
import { permissionLabel } from "@/features/admin/labels";
import { getErrorMessage } from "@/shared/api/client";
import { Icon } from "@/shared/ui/Icon";

export default function HomeAuditLanding({ universityId }: { universityId: string }) {
  const logsQuery = useQuery({
    queryKey: ["admin", universityId, "audit", "home-preview"],
    queryFn: () => getAuditLogs(universityId, { limit: 5 }),
  });

  const logs = logsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Denetim özeti</h2>
          <p className="mt-1 text-sm text-slate-500">Son korunan işlemler — tam liste için denetim izine geç.</p>
        </div>
        <Link to="/admin/audit" className="btn-primary text-sm">
          Tüm denetim izi
        </Link>
      </div>

      {logsQuery.isError && (
        <div className="alert-error">{getErrorMessage(logsQuery.error, "Denetim özeti yüklenemedi.")}</div>
      )}

      <section className="card overflow-hidden p-0">
        {logsQuery.isLoading ? (
          <div className="space-y-3 p-4">
            <div className="skeleton h-10 w-full" />
            <div className="skeleton h-10 w-full" />
          </div>
        ) : logs.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Henüz kayıt yok.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {logs.map((log) => (
              <li key={log.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <Icon name="audit" size={16} className="shrink-0 text-slate-300" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800">
                    {permissionLabel(log.action)}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : log.actorId}
                    {" · "}
                    {new Date(log.createdAt).toLocaleString("tr-TR")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
