import { useEffect } from "react";
import SelectField from "@/shared/ui/SelectField";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Modal from "@/shared/ui/Modal";
import { getErrorMessage } from "@/shared/api/client";
import type { UpdateClubDto } from "@/features/clubs/api/clubs";

// Kulüp profil formu — İKİ tüketicisi var (FRONTEND_CLUBS.md §8.1 ve §11):
//  • Başkan: PATCH /clubs/:clubId (kulüp-içi rol)
//  • Admin:  PATCH /admin/.../clubs/:clubId (club.update yetkisi)
// İkisi de aynı alan kümesini düzenler (durum HARİÇ — o admin'in ayrı ucudur);
// çağıran, onSubmit ile doğru API'yi bağlar.

const schema = z.object({
  name: z.string().trim().min(3, "En az 3 karakter olmalıdır.").max(256, "En fazla 256 karakter."),
  description: z.string().trim().max(2000, "En fazla 2000 karakter.").optional(),
  logoUrl: z.union([z.string().trim().url("Geçerli bir URL girin."), z.literal("")]).optional(),
  coverUrl: z.union([z.string().trim().url("Geçerli bir URL girin."), z.literal("")]).optional(),
  joinPolicy: z.enum(["open", "approval_required"]),
});
type FormValues = z.infer<typeof schema>;

interface ClubFormModalProps {
  open: boolean;
  title: string;
  description?: string;
  defaultValues: FormValues;
  onSubmit: (dto: UpdateClubDto) => Promise<unknown>;
  onClose: () => void;
}

export default function ClubFormModal({
  open,
  title,
  description,
  defaultValues,
  onSubmit,
  onClose,
}: ClubFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });

  useEffect(() => {
    if (open) reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (values: FormValues) => {
    try {
      await onSubmit({
        name: values.name,
        description: values.description || undefined,
        logoUrl: values.logoUrl || undefined,
        coverUrl: values.coverUrl || undefined,
        joinPolicy: values.joinPolicy,
      });
      onClose();
    } catch (error) {
      setError("root", { message: getErrorMessage(error, "Kulüp güncellenemedi.") });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </button>
          <button type="submit" form="club-form" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </>
      }
    >
      {errors.root && <div className="alert-error mb-4">{errors.root.message}</div>}
      <form id="club-form" onSubmit={handleSubmit(submit)} className="space-y-4">
        <div>
          <label className="input-label">Kulüp Adı</label>
          <input {...register("name")} className="input-field" autoFocus />
          {errors.name && <p className="input-error">{errors.name.message}</p>}
        </div>
        <div>
          <label className="input-label">Açıklama</label>
          <textarea {...register("description")} className="input-field min-h-[96px]" rows={4} />
          {errors.description && <p className="input-error">{errors.description.message}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="input-label">Logo URL</label>
            <input {...register("logoUrl")} className="input-field" placeholder="https://..." />
            {errors.logoUrl && <p className="input-error">{errors.logoUrl.message}</p>}
          </div>
          <div>
            <label className="input-label">Kapak URL</label>
            <input {...register("coverUrl")} className="input-field" placeholder="https://..." />
            {errors.coverUrl && <p className="input-error">{errors.coverUrl.message}</p>}
          </div>
        </div>
        <div>
          <label className="input-label">Üyelik Politikası</label>
          <SelectField {...register("joinPolicy")} className="select-field">
            <option value="open">Herkese açık — istek anında onaylanır</option>
            <option value="approval_required">Onay gerektirir — yönetim onaylar</option>
          </SelectField>
        </div>
      </form>
    </Modal>
  );
}
