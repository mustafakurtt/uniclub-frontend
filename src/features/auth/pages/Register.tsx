import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { getErrorMessage } from "@/shared/api/client";
import { register as registerRequest } from "@/features/auth/api/auth";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import { PasswordStrength } from "@/features/auth/components/PasswordStrength";
import { fireConfetti } from "@/shared/ui/Confetti";
import AuroraBackground from "@/shared/ui/AuroraBackground";
import Cube3D from "@/shared/ui/Cube3D";
import TiltCard from "@/shared/ui/TiltCard";
import { Icon, type IconName } from "@/shared/ui/Icon";

const registerSchema = z.object({
  firstName: z.string().min(2, "Ad en az 2 karakter olmalıdır.").max(100),
  lastName: z.string().min(2, "Soyad en az 2 karakter olmalıdır.").max(100),
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  studentNumber: z.string().optional(),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır."),
});

type RegisterDTO = z.infer<typeof registerSchema>;

const PERKS: { icon: IconName; text: string }[] = [
  { icon: "club", text: "İlgi alanına göre kulüp önerileri" },
  { icon: "member", text: "Etkinliklere tek tıkla katılım" },
  { icon: "bell", text: "Duyurular anında cebinde" },
];

export default function Register() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterDTO>({
    resolver: zodResolver(registerSchema),
  });
  const passwordValue = watch("password", "");

  const onSubmit = async (data: RegisterDTO) => {
    setServerError(null);
    setSuccessMessage(null);
    try {
      const message = await registerRequest(data);
      setSuccessMessage(message);
      fireConfetti(); // Kampüs macerası başladı — küçük bir kutlama hak edildi
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      setServerError(getErrorMessage(error, "Kayıt olurken bir hata oluştu."));
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-club-light">

      {/* SOL PANEL — hareketli aurora zemin */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between px-16 py-14 bg-aurora bg-300% animate-aurora">
        <AuroraBackground variant="dark" />

        <Link to="/" className="relative z-10 font-display text-2xl font-extrabold text-white tracking-wide animate-fade-in">
          UNI<span className="text-accent-300">CLUB</span>
        </Link>

        <div className="relative z-10">
          <h1 className="font-display text-5xl xl:text-6xl font-extrabold text-white mb-6 tracking-tight leading-[1.1] animate-fade-up">
            Aramıza<br />
            <span className="text-accent-300">katıl.</span>
          </h1>
          <p className="text-lg text-blue-100/90 font-light leading-relaxed max-w-md animate-fade-up delay-200">
            Sadece birkaç adımda profilini oluştur; kampüsteki tüm kulüplere,
            etkinliklere ve topluluğa anında dahil ol.
          </p>

          <ul className="mt-10 space-y-3">
            {PERKS.map((perk, i) => (
              <li
                key={perk.text}
                className="glass-dark rounded-2xl px-5 py-3.5 flex items-center gap-3 max-w-sm animate-fade-up"
                style={{ animationDelay: `${300 + i * 150}ms` }}
              >
                <Icon name={perk.icon} size={20} className="shrink-0 text-accent-300" />
                <span className="text-sm font-semibold text-white">{perk.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-end justify-between">
          <p className="text-sm text-blue-200/70">© {new Date().getFullYear()} UniClub</p>
          <div className="pr-10 pb-6">
            <Cube3D size={88} faces={["entrepreneurship", "arts", "esports", "sports", "debate", "science"]} />
          </div>
        </div>
      </div>

      {/* SAĞ PANEL — form */}
      <div className="w-full lg:w-1/2 relative flex items-center justify-center p-6 sm:p-10 overflow-y-auto overflow-x-hidden">
        <AuroraBackground variant="light" />

        <TiltCard maxTilt={3} className="relative z-10 w-full max-w-md rounded-4xl my-8">
          <div className="card rounded-4xl p-8 sm:p-10 animate-scale-in">

            <div className="text-center mb-6 lg:hidden">
              <Link to="/" className="font-display text-3xl font-extrabold text-brand-900">
                UNI<span className="text-gradient">CLUB</span>
              </Link>
            </div>

            <span className="badge mb-4"><Icon name="rocket" size={13} /> 1 dakikanı alır</span>
            <h2 className="font-display text-3xl font-extrabold text-slate-900 mb-2">Hesap Oluştur</h2>
            <p className="text-slate-500 mb-8">Bilgilerini girerek hemen kayıt olabilirsin.</p>

            {serverError && <div className="alert-error mb-6">{serverError}</div>}
            {successMessage && <div className="alert-success mb-6">{successMessage}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Ad</label>
                  <input {...register("firstName")} className="input-field" placeholder="Ayşe" />
                  {errors.firstName && <p className="input-error">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="input-label">Soyad</label>
                  <input {...register("lastName")} className="input-field" placeholder="Yılmaz" />
                  {errors.lastName && <p className="input-error">{errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <label className="input-label">Öğrenci Numarası</label>
                <input {...register("studentNumber")} className="input-field" placeholder="2024123456" />
              </div>

              <div>
                <label className="input-label">Okul E-posta Adresi</label>
                <input type="email" {...register("email")} className="input-field" placeholder="isim.soyisim@ogr.uni.edu.tr" />
                {errors.email && <p className="input-error">{errors.email.message}</p>}
              </div>

              <div>
                <label className="input-label">Şifre</label>
                <PasswordInput
                  registration={register("password")}
                  placeholder="En az 6 karakter"
                  autoComplete="new-password"
                />
                <PasswordStrength password={passwordValue} />
                {errors.password && <p className="input-error">{errors.password.message}</p>}
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3.5 text-base mt-4">
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Kayıt yapılıyor...
                  </>
                ) : (
                  "Kayıt Ol"
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-slate-600">
                Zaten hesabın var mı?{" "}
                <Link to="/login" className="text-brand-700 font-bold hover:underline">
                  Giriş Yap
                </Link>
              </p>
            </div>
          </div>
        </TiltCard>
      </div>
    </div>
  );
}
