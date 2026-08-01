import { useState } from "react";
import SelectField from "@/shared/ui/SelectField";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { updateMyProfile, changeMyPassword } from "@/features/auth/api/users";
import { getErrorMessage } from "@/shared/api/client";
import PageLoader from "@/shared/ui/PageLoader";
import Reveal from "@/shared/ui/Reveal";
import AuroraBackground from "@/shared/ui/AuroraBackground";
import { Icon, type IconName } from "@/shared/ui/Icon";

const profileSchema = z.object({
  firstName: z.string().min(2, "Ad en az 2 karakter olmalıdır.").max(100),
  lastName: z.string().min(2, "Soyad en az 2 karakter olmalıdır.").max(100),
  photoUrl: z.union([z.string().url("Geçerli bir URL giriniz.").max(512), z.literal("")]),
  preferredLanguage: z.string().length(2, "2 harfli dil kodu giriniz (ör. tr, en)."),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifre boş bırakılamaz."),
    newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalıdır."),
    newPasswordConfirm: z.string(),
  })
  .refine((v) => v.newPassword === v.newPasswordConfirm, {
    path: ["newPasswordConfirm"],
    message: "Şifreler eşleşmiyor.",
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

function ProfileForm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      photoUrl: user?.photoUrl ?? "",
      preferredLanguage: user?.preferredLanguage ?? "tr",
    },
  });

  const mutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: () => {
      // Profil değişti — oturum state'inin kaynağı olan /users/me'yi tazele
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      setFeedback({ type: "success", text: "Profilin güncellendi." });
    },
    onError: (error) => {
      setFeedback({ type: "error", text: getErrorMessage(error, "Profil güncellenemedi.") });
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    setFeedback(null);
    return mutation.mutateAsync({
      firstName: values.firstName,
      lastName: values.lastName,
      preferredLanguage: values.preferredLanguage,
      // Backend url validasyonu yaptığı için boş string yerine alanı hiç gönderme
      ...(values.photoUrl ? { photoUrl: values.photoUrl } : {}),
    });
  };

  return (
    <div className="card-gradient p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="icon-tile"><Icon name="edit" size={22} className="text-brand-600" /></div>
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">Profil Bilgileri</h2>
          <p className="text-xs text-slate-500">E-posta, öğrenci no ve bölüm buradan değiştirilemez.</p>
        </div>
      </div>

      {feedback && (
        <div className={`${feedback.type === "success" ? "alert-success" : "alert-error"} mb-6`}>
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Ad</label>
            <input {...register("firstName")} className="input-field" />
            {errors.firstName && <p className="input-error">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="input-label">Soyad</label>
            <input {...register("lastName")} className="input-field" />
            {errors.lastName && <p className="input-error">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="input-label">Profil Fotoğrafı (URL)</label>
          <input {...register("photoUrl")} className="input-field" placeholder="https://..." />
          {errors.photoUrl && <p className="input-error">{errors.photoUrl.message}</p>}
        </div>

        <div>
          <label className="input-label">Tercih Edilen Dil</label>
          <SelectField {...register("preferredLanguage")} className="select-field">
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </SelectField>
          {errors.preferredLanguage && <p className="input-error">{errors.preferredLanguage.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary mt-2">
          {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
    </div>
  );
}

function PasswordForm() {
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (values: PasswordFormValues) => {
    setFeedback(null);
    try {
      const message = await changeMyPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setFeedback({ type: "success", text: message });
      reset();
    } catch (error) {
      setFeedback({ type: "error", text: getErrorMessage(error, "Şifre güncellenemedi.") });
    }
  };

  return (
    <div className="card-gradient p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="icon-tile"><Icon name="lock" size={22} className="text-brand-600" /></div>
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">Şifre Değiştir</h2>
          <p className="text-xs text-slate-500">Şifre değişince açık oturumların kapanmaz.</p>
        </div>
      </div>

      {feedback && (
        <div className={`${feedback.type === "success" ? "alert-success" : "alert-error"} mb-6`}>
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="input-label">Mevcut Şifre</label>
          <input type="password" {...register("currentPassword")} className="input-field" placeholder="••••••••" />
          {errors.currentPassword && <p className="input-error">{errors.currentPassword.message}</p>}
        </div>
        <div>
          <label className="input-label">Yeni Şifre</label>
          <input type="password" {...register("newPassword")} className="input-field" placeholder="En az 6 karakter" />
          {errors.newPassword && <p className="input-error">{errors.newPassword.message}</p>}
        </div>
        <div>
          <label className="input-label">Yeni Şifre (Tekrar)</label>
          <input type="password" {...register("newPasswordConfirm")} className="input-field" placeholder="••••••••" />
          {errors.newPasswordConfirm && <p className="input-error">{errors.newPasswordConfirm.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-secondary mt-2">
          {isSubmitting ? "Güncelleniyor..." : "Şifreyi Güncelle"}
        </button>
      </form>
    </div>
  );
}

export default function Profile() {
  const { user, roleNames, clubMemberships, isLoading } = useAuth();

  if (isLoading || !user) {
    return <PageLoader label="Profilin yükleniyor..." />;
  }

  const approvedCount = clubMemberships.filter((m) => m.status === "approved").length;
  const memberSince = new Date(user.createdAt).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-8">

      {/* ====== KAPAK + TAŞAN AVATAR ====== */}
      <Reveal>
        <div className="relative">
          {/* Kapak */}
          <div className="relative overflow-hidden rounded-5xl bg-aurora bg-300% animate-aurora h-44 md:h-52 shadow-glow">
            <AuroraBackground variant="dark" />
            <span
              aria-hidden
              className="absolute -bottom-10 right-6 font-display text-[9rem] font-extrabold text-white/10 select-none leading-none"
            >
              {user.firstName.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Taşan avatar + kimlik */}
          <div className="px-6 md:px-12 -mt-14 relative z-10 flex flex-col md:flex-row md:items-end gap-5">
            <div className="w-28 h-28 rounded-[1.75rem] p-1 bg-gradient-to-br from-brand-500 via-accent-400 to-brand-700 shadow-glow-lg shrink-0 animate-scale-in">
              <div className="w-full h-full rounded-3xl bg-white flex items-center justify-center font-display text-4xl font-extrabold text-gradient overflow-hidden">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt="" className="w-full h-full object-cover rounded-3xl" />
                ) : (
                  user.firstName.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            <div className="pb-1 min-w-0">
              <h1 className="font-display text-3xl font-extrabold text-slate-900 truncate">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-slate-500 text-sm truncate">{user.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {roleNames.map((role) => (
                  <span key={role} className="badge capitalize"><Icon name="role" size={13} /> {role}</span>
                ))}
                <span className="badge"><Icon name="university" size={13} /> {approvedCount} kulüp</span>
                <span className="badge"><Icon name="calendar" size={13} /> {memberSince}'den beri üye</span>
                {user.status === "pending" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse-soft">
                    <Icon name="pending" size={13} /> E-posta doğrulaması bekleniyor
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ====== OKUL BİLGİLERİ ====== */}
      <Reveal delay={150}>
        <div className="grid sm:grid-cols-3 gap-4">
          {([
            // Platform hesabında üniversite yoktur (RequireTenantAccount bu sayfayı
            // onlara kapatır, ama tip düzeyinde null olabilir).
            ["campus", "Üniversite", user.university?.name ?? "Belirtilmemiş"],
            ["department", "Bölüm", user.department?.name ?? "Belirtilmemiş"],
            ["studentNumber", "Öğrenci Numarası", user.studentNumber ?? "Belirtilmemiş"],
          ] as [IconName, string, string][]).map(([icon, label, value], i) => (
            <div
              key={label}
              className="card-hover p-5 flex items-center gap-4"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="icon-tile"><Icon name={icon} size={22} className="text-brand-600" /></div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ====== FORMLAR ====== */}
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <Reveal delay={250}><ProfileForm /></Reveal>
        <Reveal delay={350}><PasswordForm /></Reveal>
      </div>
    </div>
  );
}
