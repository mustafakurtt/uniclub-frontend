import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { isForbiddenAdminError } from "@/features/admin/adminQueryErrors";
import { getAdminClubs } from "@/features/admin/api/clubs";
import { getAdminUsers } from "@/features/admin/api/users";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getErrorMessage } from "@/shared/api/client";
import { Icon } from "@/shared/ui/Icon";

function StatCard({ label, value, loading }: { label: string; value: number | undefined; loading: boolean }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white/80 px-4 py-3 text-center">
      <p className="font-display text-2xl font-extrabold text-slate-900">
        {loading ? "…" : (value ?? 0)}
      </p>
      <p className="text-[11px] font-semibold text-slate-400">{label}</p>
    </div>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="btn-ghost justify-between text-sm">
      {label}
      <Icon name="chevronRight" size={14} className="text-slate-300" />
    </Link>
  );
}

export default function HomeTenantOverview({ universityId }: { universityId: string }) {
  const { hasPermission } = useAuth();
  const canViewClubs = hasPermission("club.view");
  const canViewUsers = hasPermission("user.view");

  const clubsQuery = useQuery({
    queryKey: ["admin", universityId, "clubs", "all"],
    queryFn: () => getAdminClubs(universityId),
    enabled: canViewClubs,
    retry: false,
  });

  const usersQuery = useQuery({
    queryKey: ["admin", universityId, "users", "all"],
    queryFn: () => getAdminUsers(universityId),
    enabled: canViewUsers,
    retry: false,
  });

  const approvedClubs = clubsQuery.data?.filter((c) => c.status === "approved").length;
  const pendingClubs = clubsQuery.data?.filter((c) => c.status === "pending").length;
  const activeUsers = usersQuery.data?.filter((u) => u.status === "active").length;

  const systemError = [clubsQuery, usersQuery].find(
    (query) => query.isError && !isForbiddenAdminError(query.error)
  );
  const error = systemError
    ? getErrorMessage(systemError.error, "Özet yüklenemedi.")
    : null;

  const showClubStats =
    canViewClubs && !(clubsQuery.isError && isForbiddenAdminError(clubsQuery.error));
  const showUserStats =
    canViewUsers && !(usersQuery.isError && isForbiddenAdminError(usersQuery.error));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold text-slate-900">Kurum özeti</h2>
        <p className="mt-1 text-sm text-slate-500">
          Tenant durumu, yapılandırma ve denetim — günlük iş kuyruğunun üstü.
        </p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {(showClubStats || showUserStats) && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {showClubStats && (
            <>
              <StatCard label="Aktif kulüp" value={approvedClubs} loading={clubsQuery.isLoading} />
              <StatCard label="Bekleyen kulüp" value={pendingClubs} loading={clubsQuery.isLoading} />
            </>
          )}
          {showUserStats && (
            <StatCard label="Aktif kullanıcı" value={activeUsers} loading={usersQuery.isLoading} />
          )}
        </div>
      )}

      <section className="card p-5">
        <h3 className="mb-3 font-display text-sm font-bold text-slate-900">Hızlı erişim</h3>
        <div className="flex flex-col gap-1">
          {canViewClubs && <QuickLink to="/admin/clubs" label="Kulüp yönetimi" />}
          {canViewUsers && <QuickLink to="/admin/users" label="Kullanıcılar" />}
          {hasPermission("university.settings.manage") && (
            <QuickLink to="/admin/settings" label="Üniversite ayarları" />
          )}
          {hasPermission("audit.view") && <QuickLink to="/admin/audit" label="Denetim izi" />}
          {hasPermission("university.export.generate") && (
            <QuickLink to="/admin/exports" label="Rapor dışa aktarma" />
          )}
        </div>
      </section>
    </div>
  );
}
