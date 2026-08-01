import { Outlet, Link } from "react-router-dom";

/** Kamuya açık sayfalar için minimal kabuk — giriş zorunlu değil. */
export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-club-light">
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="font-display text-lg font-extrabold text-brand-900">
            UNI<span className="text-gradient">CLUB</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link to="/login" className="btn-ghost text-xs">
              Giriş Yap
            </Link>
            <Link to="/register" className="btn-primary text-xs">
              Kayıt Ol
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
