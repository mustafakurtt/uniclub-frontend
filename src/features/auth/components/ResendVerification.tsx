import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { resendVerification } from "@/features/auth/api/auth";
import { ERROR_CODES, getErrorCode, getErrorMessage, getRetryAfterSeconds } from "@/shared/api/client";
import { formatCooldown, useCooldown } from "@/shared/hooks/useCooldown";
import { Icon } from "@/shared/ui/Icon";

/**
 * "Doğrulama mailini yeniden gönder" (docs/MAIL_DOGRULAMA.md).
 *
 * Backend her zaman 200 ve hep aynı mesajı döner — hesap yoksa da, hesap zaten
 * aktifse de. Bu bir hata değil, user enumeration'a karşı bilinçli bir tasarım;
 * bu yüzden burada "gönderildi ✓" gibi kendi cümlemizi uydurmuyoruz, backend
 * mesajını olduğu gibi basıyoruz.
 *
 * İki kullanım:
 *   • <ResendVerificationButton email={...} />  — oturum açmış pending kullanıcı
 *   • <ResendVerificationForm />                — linki bozulmuş/süresi dolmuş ziyaretçi
 */
const RATE_LIMIT_FALLBACK_SECONDS = 60;

/**
 * Uç e-posta başına saatte 3 istekle sınırlı. Aşılınca 429 + `Retry-After` gelir;
 * butonu o süre boyunca kilitleriz (docs/FRONTEND_BILDIRIM_VE_LIMITLER.md §3).
 * Kilit yalnızca UX'tir — sayfa yenilenince sıfırlanır ama backend hâlâ 429 döner.
 */
const useResendMutation = () => {
  const cooldown = useCooldown();

  const mutation = useMutation({
    mutationFn: resendVerification,
    // Aynı e-postaya art arda basmanın anlamı yok: kuyruk zaten tek geçerli
    // link bırakıyor, retry yalnızca kutuyu doldurur (ve limiti yakar).
    retry: false,
    onError: (error) => {
      if (getErrorCode(error) !== ERROR_CODES.RATE_LIMITED) return;
      cooldown.start(getRetryAfterSeconds(error) ?? RATE_LIMIT_FALLBACK_SECONDS);
    },
  });

  return { ...mutation, ...cooldown };
};

/** Gönderim sonucu — başarı da hata da aynı yerde, aynı boyutta. */
function ResultLine({
  message,
  isError,
}: {
  message: string;
  isError: boolean;
}) {
  return (
    <p
      className={`mt-3 text-xs font-semibold sm:text-sm ${
        isError ? "text-rose-700" : "text-emerald-700"
      }`}
      role="status"
    >
      {message}
    </p>
  );
}

/** E-posta zaten bilindiğinde (oturum açmış `pending` kullanıcı) tek buton. */
export function ResendVerificationButton({
  email,
  className = "",
}: {
  email: string;
  className?: string;
}) {
  const { mutate, isPending, isSuccess, isError, data, error, isCoolingDown, secondsLeft } =
    useResendMutation();

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => mutate(email)}
        disabled={isPending || isSuccess || isCoolingDown}
        className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
      >
        {isPending ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-500/40 border-t-brand-600" />
            Gönderiliyor...
          </>
        ) : isCoolingDown ? (
          <>
            <Icon name="pending" size={14} />
            {formatCooldown(secondsLeft)} sonra tekrar dene
          </>
        ) : (
          <>
            <Icon name="email" size={14} />
            {isSuccess ? "Gönderildi" : "Maili yeniden gönder"}
          </>
        )}
      </button>

      {(isSuccess || isError) && (
        <ResultLine
          isError={isError}
          message={
            isError
              ? getErrorMessage(error, "Mail gönderilemedi, birazdan tekrar dene.")
              : data!
          }
        />
      )}
    </div>
  );
}

const resendSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
});

type ResendDTO = z.infer<typeof resendSchema>;

/** E-posta bilinmiyorken (public /verify hata ekranı) input + buton. */
export function ResendVerificationForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const { mutate, isPending, isSuccess, isError, data, error, isCoolingDown, secondsLeft } =
    useResendMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResendDTO>({
    resolver: zodResolver(resendSchema),
    defaultValues: { email: defaultEmail },
  });

  return (
    <form onSubmit={handleSubmit(({ email }) => mutate(email))} className="text-left">
      <label className="input-label">Okul E-posta Adresi</label>
      <input
        type="email"
        {...register("email")}
        className="input-field"
        placeholder="isim.soyisim@ogr.uni.edu.tr"
        autoComplete="email"
      />
      {errors.email && <p className="input-error">{errors.email.message}</p>}

      <button type="submit" disabled={isPending || isCoolingDown} className="btn-primary mt-3 w-full">
        {isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Gönderiliyor...
          </>
        ) : isCoolingDown ? (
          <>
            <Icon name="pending" size={16} />
            {formatCooldown(secondsLeft)} sonra tekrar dene
          </>
        ) : (
          <>
            <Icon name="email" size={16} />
            Yeni Doğrulama Maili Gönder
          </>
        )}
      </button>

      {(isSuccess || isError) && (
        <ResultLine
          isError={isError}
          message={
            isError
              ? getErrorMessage(error, "Mail gönderilemedi, birazdan tekrar dene.")
              : data!
          }
        />
      )}
    </form>
  );
}
