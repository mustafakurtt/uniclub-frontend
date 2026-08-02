import type { ReactNode } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { CLUB_PERMISSIONS, MODERATION_PERMISSIONS, UNIVERSITY_PERMISSIONS } from "@/features/auth/authorization";
import { roleLabel } from "@/features/admin/labels";
import UniversityScopeSelector from "@/features/admin/components/UniversityScopeSelector";
import CommitteeTasksNavItem from "@/features/admin/components/CommitteeTasksNavItem";
import { useShowCommitteeTasksNav } from "@/features/admin/hooks/useMyCommitteePending";
import ExportsNavItem from "@/features/exports/components/ExportsNavItem";
import NotificationBell from "@/features/notifications/components/NotificationBell";
import LanguageSwitcher from "@/shared/ui/LanguageSwitcher";

interface AdminNavItem {
  to: string;
  label: string;
  icon: IconName;
  visible: boolean;
}

interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

function NavGroupSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </p>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

/** AdminScopeProvider içinde render edilir — useAdminScope tüketen nav burada. */
export default function AdminLayoutShell() {
  const navigate = useNavigate();
  const { user, roleNames, logout, hasPermission, isPlatformAccount } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const canViewUsers = hasPermission("user.view");
  const canViewClubs = CLUB_PERMISSIONS.some((p) => hasPermission(p));
  const canModerate = hasPermission("club.view") && MODERATION_PERMISSIONS.some((p) => hasPermission(p));
  const canManageUniversityAnnouncements = hasPermission("announcement.university.manage");
  const canManageUniversities = UNIVERSITY_PERMISSIONS.some((p) => hasPermission(p));
  const canManageRoles = hasPermission("role.manage");
  const canManagePermissions = hasPermission("permission.manage");
  const canViewAudit = hasPermission("audit.view");
  const canManageSettings = hasPermission("university.settings.manage");
  const canManageAcademicTerms = hasPermission("university.academic_term.manage");
  const canExport = hasPermission("university.export.generate");
  const showCommitteeTasks = useShowCommitteeTasksNav();

  const dailyWorkItems = [
    { to: "/admin/clubs", label: "Kulüpler", icon: "club", visible: canViewClubs },
    { to: "/admin/moderation", label: "Moderasyon", icon: "moderation", visible: canModerate },
    {
      to: "/admin/university-announcements",
      label: "Okul duyuruları",
      icon: "announcement",
      visible: canManageUniversityAnnouncements,
    },
  ].filter((item) => item.visible) as AdminNavItem[];

  const showDailyWork = dailyWorkItems.length > 0 || canExport || showCommitteeTasks;

  const navGroups: AdminNavGroup[] = [
    ...(showDailyWork
      ? [{ title: "Günlük iş", items: dailyWorkItems }]
      : []),
    {
      title: "Kurum yapısı",
      items: [
        { to: "/admin/users", label: "Kullanıcılar", icon: "members", visible: canViewUsers },
        { to: "/admin/universities", label: "Akademik Yapı", icon: "university", visible: canManageUniversities },
        { to: "/admin/academic-terms", label: "Akademik Dönemler", icon: "calendar", visible: canManageAcademicTerms },
        { to: "/admin/approval-committees", label: "Onay Kurulları", icon: "members", visible: canManageSettings },
        { to: "/admin/settings", label: "Politikalar", icon: "settings", visible: canManageSettings },
      ],
    },
    {
      title: "Sistem",
      items: [
        { to: "/admin/roles", label: "Roller", icon: "role", visible: canManageRoles },
        { to: "/admin/permissions", label: "Yetkiler", icon: "lock", visible: canManagePermissions },
        { to: "/admin/audit", label: "Denetim İzi", icon: "audit", visible: canViewAudit },
      ],
    },
  ];

  const visibleGroups = navGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => item.visible) }))
    .filter((group) => group.items.length > 0);

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
    <div className="min-h-screen bg-club-light">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8">
        <aside className="lg:w-72 lg:shrink-0">
          <div className="glass sticky top-6 rounded-3xl p-5">
            <Link to="/admin" className="mb-6 flex items-center gap-2 px-2">
              <span className="font-display text-lg font-extrabold text-brand-900 tracking-wide">
                UNI<span className="text-gradient">CLUB</span>
              </span>
              <span className="badge">Yönetim</span>
            </Link>

            <div className="mb-5 flex justify-end">
              <LanguageSwitcher />
            </div>

            <div className="mb-5">
              <UniversityScopeSelector />
            </div>

            <nav>
              <NavGroupSection title="Ana sayfa">
                <NavLink to="/admin" end className={navLinkClass}>
                  <Icon name="home" size={18} />
                  Genel Bakış
                </NavLink>
              </NavGroupSection>
              {visibleGroups.map((group) => (
                <NavGroupSection key={group.title} title={group.title}>
                  {group.items.map((item) => (
                    <NavLink key={item.to} to={item.to} className={navLinkClass}>
                      <Icon name={item.icon} size={18} />
                      {item.label}
                    </NavLink>
                  ))}
                  {group.title === "Günlük iş" && (
                    <CommitteeTasksNavItem navLinkClass={navLinkClass} />
                  )}
                  {group.title === "Günlük iş" && canExport && (
                    <ExportsNavItem navLinkClass={navLinkClass} />
                  )}
                </NavGroupSection>
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
                <NotificationBell align="left" />
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2">
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

        <main className="min-w-0 flex-1 animate-fade-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
