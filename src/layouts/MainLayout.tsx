import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ResendVerificationButton } from "@/features/auth/components/ResendVerification";
import EmailNotVerifiedModal from "@/features/auth/components/EmailNotVerifiedModal";
import NotificationBell from "@/features/notifications/components/NotificationBell";
import AuroraBackground from "@/shared/ui/AuroraBackground";
import LanguageSwitcher from "@/shared/ui/LanguageSwitcher";
import { Icon } from "@/shared/ui/Icon";
import BottomTabBar from "./BottomTabBar";

/**
 * Üye kabuğu. İki ayrı navigasyon:
 *   • <md  → sade üst bar (kimlik + çıkış) + sabit alt tab bar
 *   • md+  → klasik cam üst menü, alt bar gizli
 * Alt bar sabit olduğu için `main` altında güvenli alan kadar boşluk bırakılır.
 */
export default function MainLayout() {
  const navigate = useNavigate();
  const { logout, user, isAdmin, status } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
      isActive
        ? "bg-brand-600 text-white shadow-glow"
        : "text-slate-600 hover:text-brand-700 hover:bg-brand-50"
    }`;

  const avatar = user && (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-600 to-accent-400 text-xs font-bold text-white shadow-glow">
      {user.photoUrl ? (
        <img src={user.photoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        (user.firstName[0] ?? "?").toLocaleUpperCase("tr-TR")
      )}
    </span>
  );

  return (
    <div className="min-h-screen bg-club-light">
      {/* Uygulama geneli ambient ışık katmanı — tüm sayfaların arkasında */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <AuroraBackground variant="light" />
      </div>

      <header className="sticky top-0 z-40 pt-3 sm:pt-4">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <nav className="glass rounded-2xl px-4 sm:px-6">
            <div className="flex h-14 items-center justify-between sm:h-16">
              <div className="flex items-center gap-8">
                <Link
                  to="/dashboard"
                  className="font-display text-lg font-extrabold tracking-wide text-brand-900 sm:text-xl"
                >
                  UNI<span className="text-gradient">CLUB</span>
                </Link>
                <div className="hidden items-center gap-1 md:flex">
                  <NavLink to="/dashboard" className={navLinkClass}>Ana Sayfa</NavLink>
                  <NavLink to="/clubs" className={navLinkClass}>Kulüpler</NavLink>
                  <NavLink to="/activities" className={navLinkClass}>Etkinlikler</NavLink>
                  <NavLink to="/discover" className={navLinkClass}>Keşfet</NavLink>
                  {isAdmin && <NavLink to="/admin" className={navLinkClass}>Yönetim</NavLink>}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <LanguageSwitcher />
                <NotificationBell />
                {/* Mobilde avatar profile gider (link alt barda da var); masaüstünde ad da görünür */}
                <Link
                  to="/profile"
                  className="tap flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-brand-700"
                  aria-label="Profilim"
                >
                  {avatar}
                  <span className="hidden sm:inline">{user?.firstName}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-secondary px-3 py-2 text-xs sm:px-4"
                  aria-label="Çıkış yap"
                >
                  <Icon name="logout" size={16} />
                  <span className="hidden sm:inline">Çıkış Yap</span>
                </button>
              </div>
            </div>
          </nav>

          {/* E-posta doğrulaması bekleyen kullanıcı banner'ı (§2.3: pending
              kullanıcılar login olabilir; UI uyarıyla yönetir).
              Kaynak `user.status` değil AuthContext'in `status`'ü: o
              /users/me/permissions'tan gelir ve doğrulama anında `account.verified`
              WS olayıyla tazelenir — kullanıcı maili başka sekmede açsa bile
              banner kendiliğinden kalkar (docs/FRONTEND_BILDIRIM_VE_LIMITLER.md §1). */}
          {status === "pending" && user && (
            <div className="mt-3 animate-fade-up">
              <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:px-5">
                <Icon name="email" size={20} className="shrink-0 text-amber-600" />
                <p className="flex-1 text-xs font-semibold text-amber-800 sm:text-sm">
                  Hesabın doğrulanmadı. Okul e-postandaki linke tıkla.
                  <span className="hidden sm:inline"> Link 24 saat geçerlidir.</span>
                </p>
                {/* Link süresi dolduysa kullanıcı sıkışıyordu: e-posta kullanımda
                    olduğu için yeniden kayıt da olamıyor (docs/MAIL_DOGRULAMA.md) */}
                <ResendVerificationButton email={user.email} className="shrink-0" />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Sayfa içeriği — altta sabit tab bar kadar boşluk bırakılır */}
      <main className="relative z-10 mx-auto max-w-7xl overflow-x-clip animate-fade-up px-3 pb-28 pt-6 sm:px-6 sm:pb-8 sm:pt-8 lg:px-8">
        <Outlet />
      </main>

      <BottomTabBar />

      {/* `pending` hesabın yazma denemesi 403 + EMAIL_NOT_VERIFIED alınca açılır.
          Tek yerde durduğu için her yazma çağrısı bunu ayrıca ele almaz. */}
      <EmailNotVerifiedModal />
    </div>
  );
}
