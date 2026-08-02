import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { isForbiddenAdminError } from "@/features/admin/adminQueryErrors";
import { getAdminDashboard } from "@/features/admin/api/dashboard";
import { useAdminHomeBlockVisibility } from "@/features/admin/components/admin-home/AdminHomeBlocksContext";
import { useAuth } from "@/features/auth/hooks/useAuth";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white/80 px-4 py-3 text-center">
      <p className="font-display text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="text-[11px] font-semibold text-slate-400">{label}</p>
    </div>
  );
}

interface Props {
  universityId: string;
}

export default function HomeInstitutionPulse({ universityId }: Props) {
  const { hasPermission } = useAuth();
  const canView = hasPermission("dashboard.view");

  const query = useQuery({
    queryKey: ["admin", universityId, "dashboard"],
    queryFn: () => getAdminDashboard(universityId),
    enabled: canView,
    retry: false,
  });

  const forbidden = query.isError && isForbiddenAdminError(query.error);
  const visible = canView && !forbidden && !query.isLoading && !!query.data;

  useAdminHomeBlockVisibility(
    "institution-pulse",
    !canView || forbidden ? "hidden" : query.isLoading ? "loading" : visible ? "visible" : "hidden",
  );

  if (!visible || !query.data) return null;

  const { clubsByStatus, usersByStatus, pendingApplications, upcomingActivityCount } = query.data;
  const activeClubs = clubsByStatus.approved ?? 0;
  const activeUsers = usersByStatus.active ?? 0;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Kurum nabzı</h2>
          <p className="mt-1 text-sm text-slate-500">Aktif kulüp, kullanıcı ve yaklaşan etkinlik sayıları.</p>
        </div>
        <Link to="/admin/clubs" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
          Kulüplere git
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Aktif kulüp" value={activeClubs} />
        <StatCard label="Aktif kullanıcı" value={activeUsers} />
        <StatCard label="Bekleyen başvuru" value={pendingApplications} />
        <StatCard label="Yaklaşan etkinlik" value={upcomingActivityCount} />
      </div>
    </section>
  );
}
