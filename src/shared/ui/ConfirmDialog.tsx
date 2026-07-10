import type { ReactNode } from "react";
import Modal from "@/shared/ui/Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  /** Onay metni — yıkıcı işlemlerde backend'in döneceği bağımlılık uyarısını da buraya koyabilirsin. */
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Kırmızı/yıkıcı stil (silme onayları). */
  tone?: "danger" | "primary";
  loading?: boolean;
  /** Onay sonrası gösterilecek hata (ör. FK reddi mesajı). */
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

// Proje bağımsız onay diyaloğu (core). Silme/kritik aksiyonlar için tek nokta.
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  tone = "danger",
  loading = false,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const confirmClass =
    tone === "danger"
      ? "inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-60"
      : "btn-primary";

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button type="button" className={confirmClass} onClick={onConfirm} disabled={loading}>
            {loading ? "İşleniyor..." : confirmLabel}
          </button>
        </>
      }
    >
      {error && <div className="alert-error">{error}</div>}
    </Modal>
  );
}
