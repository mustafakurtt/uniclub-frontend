import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { UNIVERSITY_PERMISSIONS } from "@/features/auth/authorization";
import { Icon } from "@/shared/ui/Icon";

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="btn-ghost justify-between text-sm">
      {label}
      <Icon name="chevronRight" size={14} className="text-slate-300" />
    </Link>
  );
}

/**
 * Kullanıcı yönetimi + akademik yapı odaklı iniş — `academic_affairs` tipi roller.
 * Başvuru listesi (`application.view`) gerektirmez.
 */
export default function HomeStructureLanding() {
  const { hasPermission } = useAuth();
  const canManageUniversities = UNIVERSITY_PERMISSIONS.some((p) => hasPermission(p));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold text-slate-900">Kurum yapısı</h2>
        <p className="mt-1 text-sm text-slate-500">
          Kullanıcılar, fakülteler, bölümler ve e-posta alan adları — günlük başvuru kuyruğunun
          dışında.
        </p>
      </div>

      <section className="card p-5">
        <h3 className="mb-3 font-display text-sm font-bold text-slate-900">Hızlı erişim</h3>
        <div className="flex flex-col gap-1">
          {hasPermission("user.view") && <QuickLink to="/admin/users" label="Kullanıcılar" />}
          {canManageUniversities && (
            <QuickLink to="/admin/universities" label="Akademik yapı" />
          )}
          {hasPermission("university.academic_term.manage") && (
            <QuickLink to="/admin/academic-terms" label="Akademik dönemler" />
          )}
        </div>
      </section>
    </div>
  );
}
