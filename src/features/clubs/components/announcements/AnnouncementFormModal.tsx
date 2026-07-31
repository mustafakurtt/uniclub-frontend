import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  announcementFormSchema,
  type AnnouncementFormValues,
} from "@/features/clubs/schemas/announcementForm";
import { createAnnouncement } from "@/features/clubs/api/clubs";
import { getErrorMessage } from "@/shared/api/client";
import { ANNOUNCEMENT_VISIBILITY_LABELS } from "@/features/clubs/labels";
import Modal from "@/shared/ui/Modal";

interface AnnouncementFormModalProps {
  open: boolean;
  clubId: string;
  onSaved: () => void;
  onClose: () => void;
}

export default function AnnouncementFormModal({
  open,
  clubId,
  onSaved,
  onClose,
}: AnnouncementFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: "",
      content: "",
      visibility: "university",
      pinned: false,
    },
  });

  const onSubmit = async (values: AnnouncementFormValues) => {
    try {
      await createAnnouncement(clubId, { ...values, publish: false });
      reset();
      onSaved();
      onClose();
    } catch (error) {
      setError("root", { message: getErrorMessage(error, "Duyuru oluşturulamadı.") });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yeni Duyuru"
      description="Taslak olarak kaydedilir; yayınlamak için listeden yayınla."
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </button>
          <button type="submit" form="announcement-form" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor..." : "Taslak Olarak Kaydet"}
          </button>
        </>
      }
    >
      {errors.root && <div className="alert-error mb-4">{errors.root.message}</div>}
      <form id="announcement-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="input-label">Başlık</label>
          <input {...register("title")} className="input-field" autoFocus />
          {errors.title && <p className="input-error">{errors.title.message}</p>}
        </div>
        <div>
          <label className="input-label">İçerik</label>
          <textarea {...register("content")} className="input-field min-h-[120px]" rows={5} />
          {errors.content && <p className="input-error">{errors.content.message}</p>}
        </div>
        <div>
          <label className="input-label">Görünürlük</label>
          <select {...register("visibility")} className="input-field">
            <option value="university">{ANNOUNCEMENT_VISIBILITY_LABELS.university}</option>
            <option value="members">{ANNOUNCEMENT_VISIBILITY_LABELS.members}</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" {...register("pinned")} className="rounded border-slate-300" />
          Oluşturulunca sabitle (en fazla 3 sabit duyuru)
        </label>
      </form>
    </Modal>
  );
}
