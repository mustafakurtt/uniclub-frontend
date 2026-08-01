import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  CLUB_PERMISSIONS,
  MODERATION_PERMISSIONS,
  UNIVERSITY_PERMISSIONS,
} from "@/features/auth/authorization";
import RequireUniversity from "@/features/admin/components/RequireUniversity";
import HomeCommitteeVotePending from "@/features/admin/components/admin-home/HomeCommitteeVotePending";
import HomeAuditLanding from "@/features/admin/components/admin-home/HomeAuditLanding";
import HomeModerationLanding from "@/features/admin/components/admin-home/HomeModerationLanding";
import HomeTenantOverview from "@/features/admin/components/admin-home/HomeTenantOverview";
import HomeWorkQueue from "@/features/admin/components/admin-home/HomeWorkQueue";
import { resolveAdminHomeVariant } from "@/features/admin/components/admin-home/resolveAdminHomeVariant";

function QuickNav() {
  const { hasPermission } = useAuth();

  const links = [
    hasPermission("user.view") ? { to: "/admin/users", label: "Kullanıcılar" } : null,
    CLUB_PERMISSIONS.some((p) => hasPermission(p))
      ? { to: "/admin/clubs", label: "Kulüp yönetimi" }
      : null,
    hasPermission("club.view") && MODERATION_PERMISSIONS.some((p) => hasPermission(p))
      ? { to: "/admin/moderation", label: "Moderasyon" }
      : null,
    UNIVERSITY_PERMISSIONS.some((p) => hasPermission(p))
      ? { to: "/admin/universities", label: "Akademik yapı" }
      : null,
    hasPermission("audit.view") ? { to: "/admin/audit", label: "Denetim izi" } : null,
  ].filter((l): l is { to: string; label: string } => l !== null);

  if (links.length === 0) return null;

  return (
    <section className="card p-5">
      <h3 className="mb-3 font-display text-sm font-bold text-slate-900">Erişilebilir bölümler</h3>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="chip hover:border-brand-400">
            {l.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function AdminHomeBody({ universityId }: { universityId: string }) {
  const { roleNames, maxRank, hasPermission } = useAuth();
  const variant = resolveAdminHomeVariant(roleNames, maxRank, hasPermission);

  return (
    <div className="space-y-6">
      <HomeCommitteeVotePending universityId={universityId} />
      {variant === "tenant" && <HomeTenantOverview universityId={universityId} />}
      {variant === "workQueue" && <HomeWorkQueue universityId={universityId} />}
      {variant === "moderation" && <HomeModerationLanding />}
      {variant === "audit" && <HomeAuditLanding universityId={universityId} />}
      {variant === "generic" && (
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-slate-900">Yönetim paneli</h2>
          <p className="mt-1 text-sm text-slate-500">
            Yetkilerine göre sol menüden bir bölüm seçebilirsin.
          </p>
        </div>
      )}
      <QuickNav />
    </div>
  );
}

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Yönetim özeti</h1>
        <p className="mt-1 text-sm text-slate-500">
          Rolüne göre özelleştirilmiş başlangıç — diğer bölümlere sidebar'dan erişebilirsin.
        </p>
      </div>
      <RequireUniversity>{(universityId) => <AdminHomeBody universityId={universityId} />}</RequireUniversity>
    </div>
  );
}
