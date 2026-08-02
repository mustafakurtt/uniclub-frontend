import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUniversityAnnouncement } from "@/features/university-announcements/api/universityAnnouncements";
import {
  universityAnnouncementFormSchema,
  type UniversityAnnouncementFormValues,
} from "@/features/university-announcements/schemas/universityAnnouncementForm";
import { useTenantTimezone } from "@/features/auth/hooks/useTenantTimezone";
import { getErrorMessage } from "@/shared/api/client";
import PublishTimingFields, {
  validatePublishTiming,
  type PublishTimingMode,
} from "@/shared/ui/PublishTimingFields";
import Modal from "@/shared/ui/Modal";

interface Props {
  open: boolean;
  universityId: string;
  onSaved: () => void;
  onClose: () => void;
}

export default function UniversityAnnouncementFormModal({
  open,
  universityId,
  onSaved,
  onClose,
}: Props) {
  const timezone = useTenantTimezone();
  const [publishMode, setPublishMode] = useState<PublishTimingMode>("draft");
  const [scheduledAtLocal, setScheduledAtLocal] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UniversityAnnouncementFormValues>({
    resolver: zodResolver(universityAnnouncementFormSchema),
    defaultValues: { title: "", content: "", pinned: false },
  });

  const onSubmit = async (values: UniversityAnnouncementFormValues) => {
    const timingErr = validatePublishTiming(publishMode, scheduledAtLocal, timezone);
    if (timingErr) {
      setError("root", { message: timingErr });
      return;
    }

    try {
      await createUniversityAnnouncement(universityId, {
        ...values,
        publish: publishMode === "now",
        ...(publishMode === "scheduled" ? { scheduledPublishAtLocal: scheduledAtLocal } : {}),
      });
      reset();
      setPublishMode("draft");
      setScheduledAtLocal("");
      onSaved();
      onClose();
    } catch (error) {
      setError("root", { message: getErrorMessage(error, "Duyuru oluşturulamadı.") });
    }
  };

  const submitLabel =
    publishMode === "now"
      ? "Şimdi yayınla"
      : publishMode === "scheduled"
        ? "Zamanla ve kaydet"
        : "Taslak olarak kaydet";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Okul duyurusu"
      description="Yayın zamanını seçmeden göndermeyin — şimdi yayınla ile anında, zamanla ile taslak + planlı yayın oluşur."
      size="lg"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </button>
          <button
            type="submit"
            form="university-announcement-form"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Kaydediliyor…" : submitLabel}
          </button>
        </>
      }
    >
      {errors.root && <div className="alert-error mb-4">{errors.root.message}</div>}
      <form
        id="university-announcement-form"
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
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" {...register("pinned")} className="rounded border-slate-300" />
          Oluşturulunca sabitle (en fazla 3 sabit okul duyurusu)
        </label>
        <PublishTimingFields
          mode={publishMode}
          onModeChange={setPublishMode}
          scheduledAtLocal={scheduledAtLocal}
          onScheduledAtLocalChange={setScheduledAtLocal}
        />
      </form>
    </Modal>
  );
}
