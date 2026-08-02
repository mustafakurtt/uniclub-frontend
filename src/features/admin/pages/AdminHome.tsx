import RequireUniversity from "@/features/admin/components/RequireUniversity";
import { AdminHomeBlocksProvider } from "@/features/admin/components/admin-home/AdminHomeBlocksContext";
import HomeBlockPendingAdvisorInvitations from "@/features/admin/components/admin-home/HomeBlockPendingAdvisorInvitations";
import HomeBlockPendingAppeals from "@/features/admin/components/admin-home/HomeBlockPendingAppeals";
import HomeBlockPendingApplications from "@/features/admin/components/admin-home/HomeBlockPendingApplications";
import HomeCommitteeVotePending from "@/features/admin/components/admin-home/HomeCommitteeVotePending";
import HomeInstitutionPulse from "@/features/admin/components/admin-home/HomeInstitutionPulse";

function AdminHomeBody({ universityId }: { universityId: string }) {
  return (
    <AdminHomeBlocksProvider>
      <div className="space-y-4">
        <HomeBlockPendingApplications universityId={universityId} />
        <HomeCommitteeVotePending universityId={universityId} />
        <HomeBlockPendingAppeals universityId={universityId} />
        <HomeBlockPendingAdvisorInvitations universityId={universityId} />
      </div>
      <div className="mt-8">
        <HomeInstitutionPulse universityId={universityId} />
      </div>
    </AdminHomeBlocksProvider>
  );
}

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Yönetim özeti</h1>
        <p className="mt-1 text-sm text-slate-500">
          Bugün sizden beklenen kararlar — her blok kendi yetkinize göre görünür.
        </p>
      </div>
      <RequireUniversity>{(universityId) => <AdminHomeBody universityId={universityId} />}</RequireUniversity>
    </div>
  );
}
