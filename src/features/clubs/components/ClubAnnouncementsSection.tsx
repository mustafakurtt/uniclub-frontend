import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createAnnouncement, deleteAnnouncement, getAnnouncements } from "@/features/clubs/api/clubs";
import { getErrorMessage } from "@/shared/api/client";
import Modal from "@/shared/ui/Modal";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import IconButton from "@/shared/ui/IconButton";
import type { Announcement } from "@/shared/types";

// Duyurular (FRONTEND_CLUBS.md §9.1). Okuma herkese açık; yazma/silme "staff"
// (danışman/officer/başkan) yetkisidir — danışman da içerik girebilir (§10).

const schema = z.object({
  title: z.string().trim().min(3, "En az 3 karakter olmalıdır.").max(256, "En fazla 256 karakter."),
  content: z.string().trim().min(1, "İçerik boş olamaz.").max(5000, "En fazla 5000 karakter."),
});
type FormValues = z.infer<typeof schema>;

interface ClubAnnouncementsSectionProps {
  clubId: string;
  /** staff (danışman/officer/başkan) → oluşturma ve silme butonları görünür */
  canManage: boolean;
}

export default function ClubAnnouncementsSection({ clubId, canManage }: ClubAnnouncementsSectionProps) {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const announcementsQuery = useQuery({
    queryKey: ["clubs", clubId, "announcements"],
    queryFn: () => getAnnouncements(clubId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["clubs", clubId, "announcements"] });

  const deleteMutation = useMutation({
    mutationFn: (announcementId: string) => deleteAnnouncement(clubId, announcementId),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  const announcements = announcementsQuery.data ?? [];

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="icon-tile"><Icon name="announcement" size={24} className="text-brand-600" /></span>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Duyurular</h2>
            <p className="text-xs text-slate-500">Kulübün güncel haberleri</p>
          </div>
        </div>
        {canManage && (
          <button className="btn-secondary text-xs" onClick={() => setCreating(true)}>
            + Duyuru
          </button>
        )}
      </div>

      {announcementsQuery.isLoading ? (
        <div className="space-y-3">
          <div className="skeleton h-16 w-full" />
          <div className="skeleton h-16 w-full" />
        </div>
      ) : announcementsQuery.isError ? (
        <div className="alert-error">
          {getErrorMessage(announcementsQuery.error, "Duyurular yüklenemedi.")}
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState icon="announcement" title="Henüz duyuru yok" />
      ) : (
        <ul className="space-y-4">
          {announcements.map((a) => (
            <li key={a.id} className="rounded-2xl border border-slate-100 bg-white/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-slate-900">{a.title}</h3>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {a.content}
                  </p>
                  <p className="mt-2 text-[11px] font-semibold text-slate-400">
                    {a.author ? `${a.author.firstName} ${a.author.lastName} · ` : ""}
                    {new Date(a.createdAt).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {canManage && (
                  <IconButton
                    icon="delete"
                    label="Duyuruyu sil"
                    tone="danger"
                    className="shrink-0"
                    onClick={() => setDeleteTarget(a)}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <AnnouncementFormModal
        open={creating}
        clubId={clubId}
        onSaved={invalidate}
        onClose={() => setCreating(false)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`"${deleteTarget?.title}" silinsin mi?`}
        confirmLabel="Sil"
        loading={deleteMutation.isPending}
        error={deleteMutation.isError ? getErrorMessage(deleteMutation.error, "Silinemedi.") : null}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => {
          setDeleteTarget(null);
          deleteMutation.reset();
        }}
      />
    </section>
  );
}

// ---- Oluşturma modal formu ----
interface AnnouncementFormModalProps {
  open: boolean;
  clubId: string;
  onSaved: () => void;
  onClose: () => void;
}

function AnnouncementFormModal({ open, clubId, onSaved, onClose }: AnnouncementFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { title: "", content: "" } });

  const onSubmit = async (values: FormValues) => {
    try {
      await createAnnouncement(clubId, values);
      onSaved();
      reset();
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
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </button>
          <button type="submit" form="announcement-form" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Yayınlanıyor..." : "Yayınla"}
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
      </form>
    </Modal>
  );
}
