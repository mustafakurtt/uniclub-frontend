import { useEffect, useState } from "react";
import Modal from "@/shared/ui/Modal";
import { Icon } from "@/shared/ui/Icon";
import { EMAIL_NOT_VERIFIED_EVENT } from "@/shared/api/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ResendVerificationButton } from "@/features/auth/components/ResendVerification";

/**
 * `pending` hesap bir YAZMA işlemi denediğinde backend 403 + code
 * EMAIL_NOT_VERIFIED döner (docs/FRONTEND_BILDIRIM_VE_LIMITLER.md §2).
 *
 * client.ts'teki interceptor bu kodu görünce global bir event fırlatır; modal
 * onu dinler. Böylece kulübe katılma, duyuru ekleme, galeri yükleme… her yazma
 * çağrısı ayrı ayrı bu durumu ele almak zorunda kalmaz.
 *
 * Doğrulama tamamlandığında `account.verified` WS olayı `status`'ü tazeler ve
 * modal kendiliğinden kapanır — kullanıcının yenilemesi gerekmez.
 */
export default function EmailNotVerifiedModal() {
  const { user, status } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onBlocked = () => setOpen(true);
    window.addEventListener(EMAIL_NOT_VERIFIED_EVENT, onBlocked);
    return () => window.removeEventListener(EMAIL_NOT_VERIFIED_EVENT, onBlocked);
  }, []);

  // Başka bir sekmede doğrulandı → soket haber verdi → modalin varlık sebebi kalmadı.
  useEffect(() => {
    if (status === "active") setOpen(false);
  }, [status]);

  if (!user) return null;

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      size="sm"
      title="Önce e-postanı doğrula"
      description="Bu işlemi yapabilmek için okul e-posta adresini doğrulaman gerekiyor."
    >
      <div className="flex items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3">
        <Icon name="email" size={18} className="mt-0.5 shrink-0 text-amber-600" />
        <p className="text-xs leading-relaxed text-amber-800">
          <span className="font-bold">{user.email}</span> adresine gönderdiğimiz linke tıkla.
          Link 24 saat geçerlidir; süresi dolduysa aşağıdan yenisini isteyebilirsin.
        </p>
      </div>

      <div className="mt-4">
        <ResendVerificationButton email={user.email} />
      </div>
    </Modal>
  );
}
