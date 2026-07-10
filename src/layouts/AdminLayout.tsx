import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { CLUB_PERMISSIONS, UNIVERSITY_PERMISSIONS } from "@/features/auth/authorization";
import { roleLabel } from "@/features/admin/labels";
import { AdminScopeProvider } from "@/features/admin/context/AdminScopeContext";
import UniversityScopeSelector from "@/features/admin/components/UniversityScopeSelector";
import NotificationBell from "@/features/notifications/components/NotificationBell";

// Yönetim panelinin kabuğu (docs/FRONTEND_YONETIM.md §7). Üye arayüzünden
// (MainLayout) ayrı, kendi sidebar'ı olan bir yönetim alanı. Kabuğa erişim
// RequireManagement (herhangi bir yönetim yetkisi) ile route seviyesinde
// kısıtlanır; sidebar linkleri ise ilgili granüler yetkiye göre görünür —
// böylece 9 rolün her biri yalnızca yetkili olduğu bölümleri görür.
interface AdminNavItem {
  to: string;
  label: string;
  icon: IconName;
  /** true → kullanıcının bu bölümü görme/yönetme yetkisi var mı */
  visible: boolean;
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, roleNames, logout, hasPermission, isPlatformAccount } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const canViewUsers = hasPermission("user.view");
  const canViewClubs = CLUB_PERMISSIONS.some((p) => hasPermission(p));
  const canManageUniversities = UNIVERSITY_PERMISSIONS.some((p) => hasPermission(p));
  const canManageRoles = hasPermission("role.manage");
  const canManagePermissions = hasPermission("permission.manage");

  const navItems: AdminNavItem[] = [
    { to: "/admin/users", label: "Kullanıcılar", icon: "members", visible: canViewUsers },
    { to: "/admin/clubs", label: "Kulüpler", icon: "club", visible: canViewClubs },
    { to: "/admin/universities", label: "Akademik Yapı", icon: "university", visible: canManageUniversities },
    { to: "/admin/roles", label: "Roller", icon: "role", visible: canManageRoles },
    { to: "/admin/permissions", label: "Yetkiler", icon: "lock", visible: canManagePermissions },
  ];

  // Rozet: en yüksek öncelikli rolün Türkçe adı (sıralama = yetki genişliği).
  const primaryRole =
    ([
      "super_admin",
      "platform_support",
      "university_admin",
      "student_affairs",
      "academic_affairs",
      "content_moderator",
      "auditor",
    ].find((r) => roleNames.includes(r)) as string | undefined) ?? roleNames[0];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
      isActive
        ? "bg-brand-600 text-white shadow-glow"
        : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
    }`;

  return (
    <AdminScopeProvider>
    <div className="min-h-screen bg-club-light">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8">
        {/* ==== SIDEBAR ==== */}
        <aside className="lg:w-72 lg:shrink-0">
          <div className="glass sticky top-6 rounded-3xl p-5">
            <Link to="/admin" className="mb-6 flex items-center gap-2 px-2">
              <span className="font-display text-lg font-extrabold text-brand-900 tracking-wide">
                UNI<span className="text-gradient">CLUB</span>
              </span>
              <span className="badge">Yönetim</span>
            </Link>

            {/* Hedef tenant — platform hesabında seçici, tenant yöneticisinde
                sadece kendi üniversitesinin adı (FRONTEND_RUTBE_VE_PLATFORM.md §2). */}
            <div className="mb-5">
              <UniversityScopeSelector />
            </div>

            <nav className="flex flex-col gap-1">
              {navItems
                .filter((item) => item.visible)
                .map((item) => (
                  <NavLink key={item.to} to={item.to} className={navLinkClass}>
                    <Icon name={item.icon} size={18} />
                    {item.label}
                  </NavLink>
                ))}
            </nav>

            <div className="my-5 h-px bg-slate-200/70" />

            {user && (
              <div className="flex items-center gap-3 px-2">
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-600 to-accent-400 text-xs font-bold text-white shadow-glow">
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (user.firstName[0] ?? "?").toUpperCase()
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{user.firstName}</p>
                  <p className="truncate text-[11px] text-slate-500">
                    {primaryRole ? roleLabel(primaryRole) : "Yönetici"}
                  </p>
                </div>
                {/* Dar sidebar: panel sağa hizalansa ekran dışına taşardı. */}
                <NotificationBell align="left" />
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2">
              {/* Platform hesabının öğrenci uygulaması yoktur (tenant'sız) — §1 */}
              {!isPlatformAccount && (
                <Link to="/dashboard" className="btn-ghost w-full justify-center text-xs">
                  <Icon name="arrowLeft" size={14} /> Uygulamaya Dön
                </Link>
              )}
              <button onClick={handleLogout} className="btn-secondary w-full justify-center text-xs">
                <Icon name="logout" size={14} /> Çıkış Yap
              </button>
            </div>
          </div>
        </aside>

        {/* ==== İÇERİK ==== */}
        <main className="min-w-0 flex-1 animate-fade-up">
          <Outlet />
        </main>
      </div>
    </div>
    </AdminScopeProvider>
  );
}
