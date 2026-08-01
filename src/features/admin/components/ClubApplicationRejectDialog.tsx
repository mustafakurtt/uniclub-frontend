import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Modal from "@/shared/ui/Modal";
import { getErrorMessage } from "@/shared/api/client";

const rejectSchema = z.object({
  note: z
    .string()
    .trim()
    .min(10, "Ret gerekçesi en az 10 karakter olmalıdır.")
    .max(1000, "En fazla 1000 karakter."),
});

type RejectFormValues = z.infer<typeof rejectSchema>;

interface ClubApplicationRejectDialogProps {
  open: boolean;
  clubName: string;
  loading: boolean;
  error: unknown;
  onConfirm: (note: string) => void;
  onClose: () => void;
}

export default function ClubApplicationRejectDialog({
  open,
  clubName,
  loading,
  error,
  onConfirm,
  onClose,
}: ClubApplicationRejectDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { note: "" },
  });

  useEffect(() => {
    if (!open) reset({ note: "" });
  }, [open, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`"${clubName}" reddedilsin mi?`}
      description="Kulüp oluşturulmaz; başvuran daha sonra yeniden başvurabilir. Ret gerekçesi zorunludur."
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>
            Vazgeç
          </button>
          <button
            type="submit"
            form="reject-application-form"
            className="btn-secondary border-red-200 text-red-600 hover:bg-red-50"
            disabled={loading}
          >
            {loading ? "Kaydediliyor…" : "Reddet"}
          </button>
        </>
      }
    >
      <form
        id="reject-application-form"
        onSubmit={handleSubmit((values) => onConfirm(values.note))}
        className="space-y-3"
      >
        <div>
          <label htmlFor="reject-note" className="input-label">
            Ret gerekçesi
          </label>
          <textarea
            id="reject-note"
            rows={4}
            className="input-field resize-y"
            placeholder="Başvuranın neyi düzeltmesi gerektiğini açıklayın…"
            {...register("note")}
          />
          {errors.note && <p className="input-error">{errors.note.message}</p>}
        </div>
        {error ? (
          <div className="alert-error text-sm">{getErrorMessage(error, "Karar kaydedilemedi.")}</div>
        ) : null}
      </form>
    </Modal>
  );
}
