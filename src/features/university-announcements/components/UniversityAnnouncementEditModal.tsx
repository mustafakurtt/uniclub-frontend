import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUniversityAnnouncement } from "@/features/university-announcements/api/universityAnnouncements";
import {
  universityAnnouncementFormSchema,
  type UniversityAnnouncementFormValues,
} from "@/features/university-announcements/schemas/universityAnnouncementForm";
import { getErrorMessage } from "@/shared/api/client";
import Modal from "@/shared/ui/Modal";
import type { UniversityAnnouncement } from "@/shared/types";

interface Props {
  open: boolean;
  universityId: string;
  announcement: UniversityAnnouncement;
  onSaved: () => void;
  onClose: () => void;
}

export default function UniversityAnnouncementEditModal({
  open,
  universityId,
  announcement,
  onSaved,
  onClose,
}: Props) {
  const isPublished = announcement.status === "published";

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UniversityAnnouncementFormValues>({
    resolver: zodResolver(universityAnnouncementFormSchema),
    defaultValues: {
      title: announcement.title,
      content: announcement.content,
      pinned: announcement.pinned,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: announcement.title,
        content: announcement.content,
        pinned: announcement.pinned,
      });
    }
  }, [open, announcement, reset]);

  const onSubmit = async (values: UniversityAnnouncementFormValues) => {
    try {
      await updateUniversityAnnouncement(universityId, announcement.id, {
        title: values.title,
        content: values.content,
      });
      onSaved();
      onClose();
    } catch (error) {
      setError("root", { message: getErrorMessage(error, "Duyuru güncellenemedi.") });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Duyuruyu düzenle"
      size="lg"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </button>
          <button
            type="submit"
            form="university-announcement-edit-form"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </>
      }
    >
      {isPublished && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Bu duyuru yayında; düzenleme herkese görünür ve &quot;düzenlendi&quot; olarak işaretlenir.
        </div>
      )}
      {errors.root && <div className="alert-error mb-4">{errors.root.message}</div>}
      <form
        id="university-announcement-edit-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div>
          <label className="input-label">Başlık</label>
          <input {...register("title")} className="input-field" autoFocus />
          {errors.title && <p className="input-error">{errors.title.message}</p>}
        </div>
        <div>
          <label className="input-label">İçerik</label>
          <textarea {...register("content")} className="input-field min-h-[160px]" rows={6} />
          {errors.content && <p className="input-error">{errors.content.message}</p>}
        </div>
      </form>
    </Modal>
  );
}
