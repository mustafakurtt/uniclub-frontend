import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  activityFormSchema,
  toActivityApiPayload,
  toDatetimeLocalValue,
  type ActivityFormValues,
} from "@/features/activities/schemas/activityForm";
import { createClubActivity, updateClubActivity } from "@/features/activities/api/clubActivities";
import { getErrorMessage } from "@/shared/api/client";
import { ACTIVITY_VISIBILITY_LABELS } from "@/features/activities/labels";
import Modal from "@/shared/ui/Modal";
import type { ActivityListItem } from "@/shared/types";

interface ActivityFormModalProps {
  open: boolean;
  clubId: string;
  activity?: ActivityListItem | null;
  onSaved: () => void;
  onClose: () => void;
}

export default function ActivityFormModal({
  open,
  clubId,
  activity,
  onSaved,
  onClose,
}: ActivityFormModalProps) {
  const isEdit = !!activity;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      coverUrl: "",
      startsAtLocal: "",
      endsAtLocal: "",
      capacity: "",
      visibility: "university",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (activity) {
      reset({
        title: activity.title,
        description: activity.description ?? "",
        location: activity.location ?? "",
        coverUrl: activity.coverUrl ?? "",
        startsAtLocal: toDatetimeLocalValue(activity.startsAt),
        endsAtLocal: activity.endsAt ? toDatetimeLocalValue(activity.endsAt) : "",
        capacity: activity.capacity != null ? String(activity.capacity) : "",
        visibility: activity.visibility,
      });
    } else {
      reset({
        title: "",
        description: "",
        location: "",
        coverUrl: "",
        startsAtLocal: "",
        endsAtLocal: "",
        capacity: "",
        visibility: "university",
      });
    }
  }, [open, activity, reset]);

  const onSubmit = async (values: ActivityFormValues) => {
    try {
      const payload = toActivityApiPayload(values);
      if (isEdit && activity) {
        await updateClubActivity(clubId, activity.id, {
          ...payload,
          endsAt: payload.endsAt ?? null,
          capacity: payload.capacity ?? null,
        });
      } else {
        await createClubActivity(clubId, { ...payload, publish: false });
      }
      onSaved();
      onClose();
    } catch (error) {
      setError("root", { message: getErrorMessage(error, "Kaydedilemedi.") });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Etkinliği Düzenle" : "Yeni Etkinlik"}
      description={
        isEdit ? undefined : "Taslak olarak kaydedilir; yayınlamak için yönetim panelini kullanın."
      }
      size="lg"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </button>
          <button type="submit" form="activity-form" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor..." : isEdit ? "Kaydet" : "Taslak Olarak Kaydet"}
          </button>
        </>
      }
    >
      {errors.root && <div className="alert-error mb-4">{errors.root.message}</div>}
      <form id="activity-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="input-label">Başlık</label>
          <input {...register("title")} className="input-field" autoFocus />
          {errors.title && <p className="input-error">{errors.title.message}</p>}
        </div>
        <div>
          <label className="input-label">Açıklama</label>
          <textarea {...register("description")} className="input-field min-h-[100px]" rows={4} />
          {errors.description && <p className="input-error">{errors.description.message}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="input-label">Başlangıç</label>
            <input type="datetime-local" {...register("startsAtLocal")} className="input-field" />
            {errors.startsAtLocal && <p className="input-error">{errors.startsAtLocal.message}</p>}
          </div>
          <div>
            <label className="input-label">Bitiş (opsiyonel)</label>
            <input type="datetime-local" {...register("endsAtLocal")} className="input-field" />
            {errors.endsAtLocal && <p className="input-error">{errors.endsAtLocal.message}</p>}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="input-label">Konum</label>
            <input {...register("location")} className="input-field" />
          </div>
          <div>
            <label className="input-label">Kontenjan (boş = sınırsız)</label>
            <input {...register("capacity")} className="input-field" inputMode="numeric" />
            {errors.capacity && <p className="input-error">{errors.capacity.message}</p>}
          </div>
        </div>
        <div>
          <label className="input-label">Kapak görseli URL</label>
          <input {...register("coverUrl")} className="input-field" placeholder="https://..." />
          {errors.coverUrl && <p className="input-error">{errors.coverUrl.message}</p>}
        </div>
        <div>
          <label className="input-label">Görünürlük</label>
          <select {...register("visibility")} className="input-field">
            <option value="university">{ACTIVITY_VISIBILITY_LABELS.university}</option>
            <option value="members">{ACTIVITY_VISIBILITY_LABELS.members}</option>
          </select>
        </div>
      </form>
    </Modal>
  );
}
