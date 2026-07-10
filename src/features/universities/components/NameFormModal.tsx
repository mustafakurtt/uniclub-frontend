import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Modal from "@/shared/ui/Modal";

// Yönetim panelindeki "tek isim alanı" olan varlıklar (fakülte, bölüm) ve
// isteğe bağlı slug taşıyan üniversite düzenleme formu için ortak modal.
// create/update ayrımı yapmaz — çağıran `onSubmit` ile API'yi bağlar.

const nameSchema = z.object({
  name: z.string().trim().min(2, "En az 2 karakter olmalıdır.").max(256, "En fazla 256 karakter."),
  slug: z
    .union([
      z.string().trim().min(2, "En az 2 karakter olmalıdır.").max(256, "En fazla 256 karakter."),
      z.literal(""),
    ])
    .optional(),
});

export type NameFormValues = z.infer<typeof nameSchema>;

interface NameFormModalProps {
  open: boolean;
  title: string;
  description?: string;
  nameLabel?: string;
  /** true → slug alanı da gösterilir (üniversite için). */
  withSlug?: boolean;
  defaultValues?: Partial<NameFormValues>;
  submitLabel?: string;
  error?: string | null;
  /** Değeri önemsizdir; mutateAsync gibi bir Promise'ı doğrudan bağlayabilirsiniz. */
  onSubmit: (values: NameFormValues) => Promise<unknown> | void;
  onClose: () => void;
}

export default function NameFormModal({
  open,
  title,
  description,
  nameLabel = "Ad",
  withSlug = false,
  defaultValues,
  submitLabel = "Kaydet",
  error,
  onSubmit,
  onClose,
}: NameFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NameFormValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: "", slug: "", ...defaultValues },
  });

  // Modal her açıldığında formu düzenlenen kayda göre sıfırla.
  useEffect(() => {
    if (open) reset({ name: "", slug: "", ...defaultValues });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </button>
          <button
            type="submit"
            form="name-form-modal"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Kaydediliyor..." : submitLabel}
          </button>
        </>
      }
    >
      {error && <div className="alert-error mb-4">{error}</div>}
      <form id="name-form-modal" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="input-label">{nameLabel}</label>
          <input {...register("name")} className="input-field" autoFocus />
          {errors.name && <p className="input-error">{errors.name.message}</p>}
        </div>
        {withSlug && (
          <div>
            <label className="input-label">Slug</label>
            <input {...register("slug")} className="input-field" placeholder="ornek-uni" />
            {errors.slug && <p className="input-error">{errors.slug.message}</p>}
          </div>
        )}
      </form>
    </Modal>
  );
}
