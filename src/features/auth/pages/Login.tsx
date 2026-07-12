import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { ERROR_CODES, getErrorCode, getErrorMessage, getRetryAfterSeconds } from "@/shared/api/client";
import { formatCooldown, useCooldown } from "@/shared/hooks/useCooldown";
import { login as loginRequest } from "@/features/auth/api/auth";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import AuroraBackground from "@/shared/ui/AuroraBackground";
import Cube3D from "@/shared/ui/Cube3D";
import TiltCard from "@/shared/ui/TiltCard";
import { Icon } from "@/shared/ui/Icon";
import LanguageSwitcher from "@/shared/ui/LanguageSwitcher";

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  password: z.string().min(1, "Şifre boş bırakılamaz."),
});

type LoginDTO = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  // Login hesap (e-posta) başına 15 dakikada 10 denemeyle sınırlı — IP başına
  // değil: kampüs NAT'ı arkasında tek öğrenci tüm okulu kilitlemesin
  // (docs/FRONTEND_BILDIRIM_VE_LIMITLER.md §3).
  const { isCoolingDown, secondsLeft, start: startCooldown } = useCooldown();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginDTO>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginDTO) => {
    setServerError(null);
    try {
      const { token, user } = await loginRequest(data);
      login(token);
      // Tenant'sız platform hesabının öğrenci kabuğu yoktur; RequireTenantAccount
      // zaten /admin'e sektirir ama login yanıtı universityId'yi hemen verdiği
      // için doğrudan gönderip ara yüklemeyi atlıyoruz (§1).
      navigate(user.universityId === null ? "/admin" : "/dashboard");
    } catch (error) {
      if (getErrorCode(error) === ERROR_CODES.RATE_LIMITED) {
        startCooldown(getRetryAfterSeconds(error) ?? 60);
      }
      setServerError(getErrorMessage(error, "Giriş başarısız."));
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-club-light">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* SOL PANEL — hareketli aurora zemin + 3D küp */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between px-16 py-14 bg-aurora bg-300% animate-aurora">
        <AuroraBackground variant="dark" />

        <Link to="/" className="relative z-10 font-display text-2xl font-extrabold text-white tracking-wide animate-fade-in">
          UNI<span className="text-accent-300">CLUB</span>
        </Link>

        <div className="relative z-10">
          <h1 className="font-display text-5xl xl:text-6xl font-extrabold text-white mb-6 tracking-tight leading-[1.1] animate-fade-up">
            Kampüsün kalbi<br />
            <span className="text-accent-300">burada atıyor.</span>
          </h1>
          <p className="text-lg text-blue-100/90 font-light leading-relaxed max-w-md animate-fade-up delay-200">
            Etkinlikler, duyurular, yeni insanlar… Hepsi tek bir yerde.
            Hesabına giriş yap ve kaldığın yerden devam et.
          </p>

          {/* Yüzen cam istatistik kartları */}
          <div className="mt-10 flex gap-4 animate-fade-up delay-300">
            <div className="glass-dark rounded-2xl px-5 py-4 animate-float">
              <p className="text-2xl font-extrabold text-white">120+</p>
              <p className="text-xs text-blue-100/80 font-medium">Aktif Kulüp</p>
            </div>
            <div className="glass-dark rounded-2xl px-5 py-4 animate-float-slow delay-500">
              <p className="text-2xl font-extrabold text-white">15K</p>
              <p className="text-xs text-blue-100/80 font-medium">Öğrenci</p>
            </div>
            <div className="glass-dark rounded-2xl px-5 py-4 animate-float delay-700">
              <p className="text-2xl font-extrabold text-white">300+</p>
              <p className="text-xs text-blue-100/80 font-medium">Etkinlik / Yıl</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-end justify-between">
          <p className="text-sm text-blue-200/70">© {new Date().getFullYear()} UniClub</p>
          <div className="pr-10 pb-6">
            <Cube3D size={96} />
          </div>
        </div>
      </div>

      {/* SAĞ PANEL — form */}
      <div className="w-full lg:w-1/2 relative flex items-center justify-center p-6 sm:p-10 overflow-hidden">
        <AuroraBackground variant="light" />

        <TiltCard maxTilt={4} className="relative z-10 w-full max-w-md rounded-4xl">
          <div className="card rounded-4xl p-8 sm:p-10 animate-scale-in">

            <div className="text-center mb-8 lg:hidden">
              <Link to="/" className="font-display text-3xl font-extrabold text-brand-900">
                UNI<span className="text-gradient">CLUB</span>
              </Link>
            </div>

            <span className="badge mb-4"><Icon name="wave" size={13} /> Tekrar hoş geldin</span>
            <h2 className="font-display text-3xl font-extrabold text-slate-900 mb-2">Giriş Yap</h2>
            <p className="text-slate-500 mb-8">Devam etmek için bilgilerini gir.</p>

            {serverError && <div className="alert-error mb-6">{serverError}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="input-label">Okul E-posta Adresi</label>
                <input
                  type="email"
                  {...register("email")}
                  className="input-field"
                  placeholder="isim.soyisim@ogr.uni.edu.tr"
                />
                {errors.email && <p className="input-error">{errors.email.message}</p>}
              </div>

              <div>
                <label className="input-label">Şifre</label>
                <PasswordInput
                  registration={register("password")}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                {errors.password && <p className="input-error">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isCoolingDown}
                className="btn-primary w-full py-3.5 text-base mt-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Giriş yapılıyor...
                  </>
                ) : isCoolingDown ? (
                  `${formatCooldown(secondsLeft)} sonra tekrar dene`
                ) : (
                  "Giriş Yap"
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-slate-600">
                Hesabın yok mu?{" "}
                <Link to="/register" className="text-brand-700 font-bold hover:underline">
                  Hemen Kayıt Ol
                </Link>
              </p>
            </div>
          </div>
        </TiltCard>
      </div>
    </div>
  );
}
