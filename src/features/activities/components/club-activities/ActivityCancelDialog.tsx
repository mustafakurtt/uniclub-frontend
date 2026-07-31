import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  activityCancelSchema,
  type ActivityCancelValues,
} from "@/features/activities/schemas/activityForm";
import Modal from "@/shared/ui/Modal";

interface ActivityCancelDialogProps {
  open: boolean;
  title: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * İptal onayı — gerekçe alanı UX içindir (FRONTEND_ETKINLIKLER.md cancel body almaz).
 * Staff iptal etmeden önce gerekçeyi düşünür; API'ye gönderilmez.
 */
export default function ActivityCancelDialog({
  open,
  title,
  loading,
  error,
  onConfirm,
  onClose,
}: ActivityCancelDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivityCancelValues>({
    resolver: zodResolver(activityCancelSchema),
    defaultValues: { reason: "" },
  });

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title="Etkinliği iptal et"
      description={`"${title}" iptal edilecek. Katılımcılara bildirim gidecek.`}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>
            Vazgeç
          </button>
          <button
            type="submit"
            form="activity-cancel-form"
            className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "İptal ediliyor..." : "İptal Et"}
          </button>
        </>
      }
    >
      {error && <div className="alert-error mb-4">{error}</div>}
      <form id="activity-cancel-form" onSubmit={handleSubmit(onConfirm)} className="space-y-3">
        <div>
          <label className="input-label">İptal gerekçesi</label>
          <textarea
            {...register("reason")}
            className="input-field min-h-[80px]"
            rows={3}
            placeholder="Katılımcılara iletilecek bir not değil — ekip içi kayıt."
          />
          {errors.reason && <p className="input-error">{errors.reason.message}</p>}
        </div>
      </form>
    </Modal>
  );
}
