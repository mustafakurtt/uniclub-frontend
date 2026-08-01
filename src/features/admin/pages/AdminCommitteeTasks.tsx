import { Navigate } from "react-router-dom";
import CommitteePendingApplicationsList from "@/features/admin/components/CommitteePendingApplicationsList";
import RequireUniversity from "@/features/admin/components/RequireUniversity";
import { useMyCommitteePendingApplications } from "@/features/admin/hooks/useMyCommitteePending";
import { getErrorMessage } from "@/shared/api/client";
import EmptyState from "@/shared/ui/EmptyState";
import PageLoader from "@/shared/ui/PageLoader";
import { Icon } from "@/shared/ui/Icon";

function CommitteeTasksBody({ universityId }: { universityId: string }) {
  const pending = useMyCommitteePendingApplications(universityId);

  if (pending.access === "loading") {
    return <PageLoader label="Kurul görevleri yükleniyor…" />;
  }

  if (pending.access === "forbidden") {
    return <Navigate to="/admin" replace />;
  }

  if (pending.access === "error") {
    return (
      <div className="alert-error">
        {getErrorMessage(pending.error, "Kurul görevleri yüklenemedi.")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Kurul Görevlerim</h1>
        <p className="mt-1 text-sm text-slate-500">
          Üyesi olduğunuz kurullarda oyunuzu bekleyen kulüp kurma başvuruları.
        </p>
      </div>

      {pending.items.length === 0 ? (
        <EmptyState
          icon="pending"
          title="Oyunuzu bekleyen başvuru yok."
          description="Yeni bir kurul oylaması size düştüğünde burada görünecek."
        />
      ) : (
        <section className="card border-violet-100 bg-violet-50/30 p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="icon-tile shrink-0">
              <Icon name="pending" size={22} className="text-violet-600" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                {pending.items.length} başvuru oyunuzu bekliyor
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Satıra tıklayarak başvuru detayına gidip oyunuzu kullanabilirsiniz.
              </p>
            </div>
          </div>
          <CommitteePendingApplicationsList items={pending.items} />
        </section>
      )}
    </div>
  );
}

export default function AdminCommitteeTasks() {
  return (
    <RequireUniversity>
      {(universityId) => <CommitteeTasksBody universityId={universityId} />}
    </RequireUniversity>
  );
}
