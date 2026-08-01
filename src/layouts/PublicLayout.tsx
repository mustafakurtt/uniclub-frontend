import { Link, Outlet } from "react-router-dom";
import { Icon } from "@/shared/ui/Icon";

/** Kamuya açık sayfalar — auth yok, minimal üst bar. */
export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-club-light">
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="font-display text-lg font-extrabold tracking-wide text-slate-900"
          >
            UNI<span className="text-brand-600">CLUB</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-ghost text-xs sm:text-sm">
              Giriş Yap
            </Link>
            <Link to="/register" className="btn-primary text-xs sm:text-sm">
              Kayıt Ol
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        <p className="flex items-center justify-center gap-1.5">
          <Icon name="club" size={14} className="text-brand-500" />
          UniClub — kampüs toplulukları
        </p>
      </footer>
    </div>
  );
}
