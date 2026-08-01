import RequireUniversity from "@/features/admin/components/RequireUniversity";
import HomeAccessibleSections from "@/features/admin/components/admin-home/HomeAccessibleSections";
import HomeAuditLanding from "@/features/admin/components/admin-home/HomeAuditLanding";
import HomeCommitteeVotePending from "@/features/admin/components/admin-home/HomeCommitteeVotePending";
import HomeModerationLanding from "@/features/admin/components/admin-home/HomeModerationLanding";
import HomeStructureLanding from "@/features/admin/components/admin-home/HomeStructureLanding";
import HomeTenantOverview from "@/features/admin/components/admin-home/HomeTenantOverview";
import HomeWorkQueue from "@/features/admin/components/admin-home/HomeWorkQueue";
import { resolveAdminHomeVariant } from "@/features/admin/components/admin-home/resolveAdminHomeVariant";
import { useMyCommitteePendingApplications } from "@/features/admin/hooks/useMyCommitteePending";
import { useAuth } from "@/features/auth/hooks/useAuth";

function AdminHomeBody({ universityId }: { universityId: string }) {
  const { roleNames, maxRank, hasPermission } = useAuth();
  const variant = resolveAdminHomeVariant(roleNames, maxRank, hasPermission);
  const committeePending = useMyCommitteePendingApplications(universityId);
  const showCommitteeTasks =
    committeePending.access === "ok" && committeePending.items.length > 0;

  return (
    <div className="space-y-6">
      <HomeCommitteeVotePending universityId={universityId} />
      {variant === "tenant" && <HomeTenantOverview universityId={universityId} />}
      {variant === "workQueue" && <HomeWorkQueue universityId={universityId} />}
      {variant === "moderation" && <HomeModerationLanding />}
      {variant === "audit" && <HomeAuditLanding universityId={universityId} />}
      {variant === "structure" && <HomeStructureLanding />}
      {variant === "generic" && (
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-slate-900">Yönetim paneli</h2>
          <p className="mt-1 text-sm text-slate-500">
            Aşağıdaki bölümlerden yetkiniz olan alanlara geçebilirsiniz.
          </p>
        </div>
      )}
      <HomeAccessibleSections showCommitteeTasks={showCommitteeTasks} />
    </div>
  );
}

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Yönetim özeti</h1>
        <p className="mt-1 text-sm text-slate-500">
          Yetkilerinize göre özelleştirilmiş başlangıç — diğer bölümlere sidebar'dan erişebilirsiniz.
        </p>
      </div>
      <RequireUniversity>{(universityId) => <AdminHomeBody universityId={universityId} />}</RequireUniversity>
    </div>
  );
}
