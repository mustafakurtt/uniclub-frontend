import { Link } from "react-router-dom";
import { buildAdminQuickLinks } from "@/features/admin/adminQuickLinks";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface HomeAccessibleSectionsProps {
  showCommitteeTasks?: boolean;
}

/** Yetkiye göre erişilebilir bölüm kısayolları — generic ve tüm varyantlarda yedek. */
export default function HomeAccessibleSections({
  showCommitteeTasks = false,
}: HomeAccessibleSectionsProps) {
  const { hasPermission } = useAuth();
  const links = buildAdminQuickLinks(hasPermission, { committeeTasks: showCommitteeTasks });

  if (links.length === 0) return null;

  return (
    <section className="card p-5">
      <h3 className="mb-1 font-display text-sm font-bold text-slate-900">Erişilebilir bölümler</h3>
      <p className="mb-3 text-xs text-slate-500">
        Yetkilerinize göre kullanabileceğiniz yönetim alanları.
      </p>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="chip hover:border-brand-400">
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
