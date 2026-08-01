import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toDatetimeLocalValue } from "@/features/activities/formatActivityDateTime";
import { useTenantTimezone } from "@/features/auth/hooks/useTenantTimezone";
import {
  isValidScheduledPublishLocal,
  localDatetimeToIsoOffset,
  scheduledUtcToTenantLocal,
} from "@/shared/lib/tenantLocalDatetime";
import Modal from "@/shared/ui/Modal";
import type { AcademicTerm } from "@/shared/types";

const formSchema = z
  .object({
    name: z.string().trim().min(2, "En az 2 karakter olmalıdır.").max(128, "En fazla 128 karakter."),
    startsAtLocal: z.string().min(1, "Başlangıç tarihi zorunludur."),
    endsAtLocal: z.string().min(1, "Bitiş tarihi zorunludur."),
  })
  .refine(
    (data) => {
      if (!isValidScheduledPublishLocal(data.startsAtLocal) || !isValidScheduledPublishLocal(data.endsAtLocal)) {
        return false;
      }
      return data.endsAtLocal > data.startsAtLocal;
    },
    { message: "Bitiş tarihi başlangıçtan sonra olmalıdır.", path: ["endsAtLocal"] }
  );

type FormValues = z.infer<typeof formSchema>;

function isoToLocalInput(iso: string, timezone: string | null): string {
  if (timezone) return scheduledUtcToTenantLocal(iso, timezone);
  return toDatetimeLocalValue(iso);
}

interface AcademicTermFormModalProps {
  open: boolean;
  term?: AcademicTerm | null;
  error?: string | null;
  onSubmit: (values: { name: string; startsAt: string; endsAt: string }) => Promise<unknown> | void;
  onClose: () => void;
}

export default function AcademicTermFormModal({
  open,
  term,
  error,
  onSubmit,
  onClose,
}: AcademicTermFormModalProps) {
  const timezone = useTenantTimezone();
  const isEdit = Boolean(term);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", startsAtLocal: "", endsAtLocal: "" },
  });

  useEffect(() => {
    if (!open) return;
    if (term) {
      reset({
        name: term.name,
        startsAtLocal: isoToLocalInput(term.startsAt, timezone),
        endsAtLocal: isoToLocalInput(term.endsAt, timezone),
      });
    } else {
      reset({ name: "", startsAtLocal: "", endsAtLocal: "" });
    }
  }, [open, term, timezone, reset]);

  const handleFormSubmit = async (values: FormValues) => {
    await onSubmit({
      name: values.name,
      startsAt: localDatetimeToIsoOffset(values.startsAtLocal, timezone),
      endsAt: localDatetimeToIsoOffset(values.endsAtLocal, timezone),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Dönemi düzenle" : "Yeni akademik dönem"}
      description="Kurumunuzun akademik takvimini tanımlayın. Çakışan tarih aralıkları kayıt sırasında reddedilir."
      size="sm"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </button>
          <button
            type="submit"
            form="academic-term-form"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Kaydediliyor…" : isEdit ? "Güncelle" : "Oluştur"}
          </button>
        </>
      }
    >
      {error && <div className="alert-error mb-4">{error}</div>}
      <form id="academic-term-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label className="input-label" htmlFor="term-name">
            Dönem adı
          </label>
          <input
            id="term-name"
            {...register("name")}
            className="input-field"
            placeholder="2026–2027 Güz"
            autoFocus
          />
          {errors.name && <p className="input-error">{errors.name.message}</p>}
        </div>
        <div>
          <label className="input-label" htmlFor="term-starts">
            Başlangıç
          </label>
          <input id="term-starts" type="datetime-local" {...register("startsAtLocal")} className="input-field" />
          {errors.startsAtLocal && <p className="input-error">{errors.startsAtLocal.message}</p>}
        </div>
        <div>
          <label className="input-label" htmlFor="term-ends">
            Bitiş
          </label>
          <input id="term-ends" type="datetime-local" {...register("endsAtLocal")} className="input-field" />
          {errors.endsAtLocal && <p className="input-error">{errors.endsAtLocal.message}</p>}
        </div>
      </form>
    </Modal>
  );
}
