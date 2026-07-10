import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { verifyEmail } from "@/features/auth/api/auth";
import { ResendVerificationForm } from "@/features/auth/components/ResendVerification";
import { getErrorMessage } from "@/shared/api/client";
import { fireConfetti } from "@/shared/ui/Confetti";
import AuroraBackground from "@/shared/ui/AuroraBackground";
import PageLoader from "@/shared/ui/PageLoader";
import { Icon } from "@/shared/ui/Icon";

/**
 * /verify?token=<uuid> — e-postadaki doğrulama linkinin indiği sayfa
 * (docs/FRONTEND_AUTH_RBAC.md §2.3, §4.3). Token tek kullanımlıktır;
 * useQuery aynı token için isteği tekilleştirir (StrictMode çift mount
 * dahil), böylece token yanlışlıkla "zaten kullanılmış"a düşmez.
 */
export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { data: message, isLoading, isError, error } = useQuery({
    queryKey: ["verifyEmail", token],
    queryFn: () => verifyEmail(token!),
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });

  const succeeded = !!message;

  // Hesap aktifleşti — kayıt akışının en büyük "kazandın" anı.
  useEffect(() => {
    if (succeeded) fireConfetti();
  }, [succeeded]);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-club-light">
      <AuroraBackground variant="light" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-3xl font-extrabold text-brand-900">
            UNI<span className="text-gradient">CLUB</span>
          </Link>
        </div>

        <div className="card rounded-4xl p-10 text-center animate-scale-in">
          {!token ? (
            <>
              <Icon name="link" size={48} className="mx-auto mb-5 text-brand-500" />
              <h1 className="font-display text-2xl font-extrabold text-slate-900 mb-2">
                Doğrulama linki eksik
              </h1>
              <p className="text-slate-500 mb-6">
                Bu sayfaya e-postandaki doğrulama linkiyle ulaşman gerekiyor.
                Linki kopyalarken eksik kalmış olabilir — istersen yenisini isteyebilirsin.
              </p>
              <ResendVerificationForm />
              <Link to="/login" className="btn-ghost w-full mt-3">Giriş Sayfasına Dön</Link>
            </>
          ) : isLoading ? (
            <PageLoader label="E-postan doğrulanıyor..." />
          ) : succeeded ? (
            <>
              <Icon name="party" size={48} className="mx-auto mb-5 animate-float text-brand-500" />
              <h1 className="font-display text-2xl font-extrabold text-slate-900 mb-2">
                Hesabın aktif!
              </h1>
              <p className="text-slate-500 mb-8">{message}</p>
              <Link to="/login" className="btn-primary w-full">Giriş Yap</Link>
            </>
          ) : isError ? (
            <>
              <Icon name="error" size={48} className="mx-auto mb-5 text-brand-500" />
              <h1 className="font-display text-2xl font-extrabold text-slate-900 mb-2">
                Doğrulama başarısız
              </h1>
              <p className="text-slate-500 mb-6">
                {getErrorMessage(error, "Doğrulama sırasında bir hata oluştu.")}
              </p>
              {/* Süresi dolmuş / kullanılmış link buraya düşüyor. Tekrar kayıt
                  bir çıkmaz (e-posta zaten kullanımda), doğru çıkış yeni mail. */}
              <ResendVerificationForm />
              <Link to="/login" className="btn-ghost w-full mt-3">Giriş Sayfasına Dön</Link>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
