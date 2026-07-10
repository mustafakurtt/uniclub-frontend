import { NavLink } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Icon, type IconName } from "@/shared/ui/Icon";

/**
 * Mobil alt navigasyon (yalnızca <md). Masaüstünde üst menü kullanılır.
 *
 * Neden alt bar: üst menüdeki linkler `hidden md:flex` olduğu için telefonda
 * hiçbir sayfaya gidilemiyordu. Alt bar aynı zamanda başparmak erişim
 * bölgesinde — telefonda tek elle kullanım için üst menüden çok daha iyi.
 *
 * `NavLink` aktif rotada `aria-current="page"` verir; renk ve üstteki gösterge
 * çubuğu bu attribute'a bağlı (bkz. `.tab-item`, src/index.css).
 */
interface Tab {
  to: string;
  label: string;
  icon: IconName;
}

export default function BottomTabBar() {
  const { isAdmin } = useAuth();

  const tabs: Tab[] = [
    { to: "/dashboard", label: "Ana Sayfa", icon: "home" },
    { to: "/clubs", label: "Keşfet", icon: "explore" },
    { to: "/profile", label: "Profil", icon: "profile" },
    ...(isAdmin ? [{ to: "/admin", label: "Yönetim", icon: "officer" as IconName }] : []),
  ];

  return (
    <nav
      aria-label="Ana navigasyon"
      className="fixed inset-x-0 bottom-0 z-50 pb-safe md:hidden"
    >
      <div className="glass mx-3 mb-3 flex items-center gap-1 rounded-3xl px-2 py-1.5 shadow-card-hover">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} className="tab-item">
            {({ isActive }) => (
              <>
                <Icon
                  name={t.icon}
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? "-translate-y-0.5 transition-transform" : "transition-transform"}
                />
                <span>{t.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
