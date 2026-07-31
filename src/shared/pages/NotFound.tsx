import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import AuroraBackground from "@/shared/ui/AuroraBackground";
import Reveal from "@/shared/ui/Reveal";
import { Icon } from "@/shared/ui/Icon";

/**
 * Bilinmeyen rota yakalayıcısı — App.tsx `path="*"`.
 * Giriş yapmış kullanıcıya panel linkleri; ziyaretçiye vitrin linkleri sunar.
 */
export default function NotFound() {
  const { token } = useAuth();
  const isLoggedIn = !!token;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6 text-center">
      <AuroraBackground variant="light" />

      <Reveal className="relative z-10 max-w-lg">
        <div className="relative mx-auto mb-8 flex h-28 w-28 items-center justify-center">
          <span
            className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-brand-500/20 to-accent-500/20 blur-xl"
            aria-hidden
          />
          <span className="icon-tile relative h-24 w-24 animate-float rounded-[1.75rem] shadow-glow">
            <Icon name="notFound" size={44} className="text-brand-600" />
          </span>
        </div>

        <p className="mb-2 font-display text-8xl font-extrabold leading-none text-gradient md:text-9xl">
          404
        </p>
        <h1 className="mb-3 font-display text-2xl font-bold text-slate-900 md:text-3xl">
          Bu sayfa kampüste yok.
        </h1>
        <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-slate-500 md:text-base">
          Aradığın adres taşınmış, silinmiş ya da hiç var olmamış olabilir. URL&apos;yi
          kontrol et veya aşağıdaki bağlantılardan devam et.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="btn-primary">
                <Icon name="home" size={16} /> Panele Dön
              </Link>
              <Link to="/clubs" className="btn-secondary">
                <Icon name="explore" size={16} /> Kulüpleri Keşfet
              </Link>
              <Link to="/activities" className="btn-ghost">
                <Icon name="calendar" size={16} /> Etkinlikler
              </Link>
            </>
          ) : (
            <>
              <Link to="/" className="btn-primary">
                <Icon name="home" size={16} /> Ana Sayfa
              </Link>
              <Link to="/login" className="btn-secondary">
                Giriş Yap
              </Link>
              <Link to="/register" className="btn-ghost">
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      </Reveal>

      <p className="relative z-10 mt-12 text-xs font-semibold text-slate-400">
        Hata kodu: 404 · Sayfa bulunamadı
      </p>
    </div>
  );
}
