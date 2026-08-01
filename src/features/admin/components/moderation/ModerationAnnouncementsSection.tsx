import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAnnouncements } from "@/features/clubs/api/clubs";
import { removeAdminAnnouncement } from "@/features/admin/api/moderation";
import { getErrorMessage } from "@/shared/api/client";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import IconButton from "@/shared/ui/IconButton";
import type { Announcement } from "@/shared/types";

/**
 * Duyuru moderasyonu (`announcement.moderate`) — liste PUBLIC uçtan okunur
 * (`GET /clubs/:clubId/announcements`, herkes görebilir), yalnızca KALDIRMA
 * admin ucundandır. Oluşturma burada YOK — o kulüp staff'ının işi (§9.1).
 */
interface ModerationAnnouncementsSectionProps {
  universityId: string;
  clubId: string;
  canModerate: boolean;
}

export default function ModerationAnnouncementsSection({
  universityId,
  clubId,
  canModerate,
}: ModerationAnnouncementsSectionProps) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const announcementsQuery = useQuery({
    queryKey: ["clubs", clubId, "announcements"],
    queryFn: () => getAnnouncements(clubId),
  });

  const deleteMutation = useMutation({
    mutationFn: (announcementId: string) =>
      removeAdminAnnouncement(universityId, clubId, announcementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clubs", clubId, "announcements"] });
      setDeleteTarget(null);
    },
  });

  const announcements = announcementsQuery.data ?? [];

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="icon-tile"><Icon name="announcement" size={24} className="text-brand-600" /></span>
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Duyurular</h2>
          <p className="text-xs text-slate-500">Uygunsuz duyuruları kaldır</p>
        </div>
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
        <EmptyState icon="announcement" title="Bu kulüpte duyuru yok" />
      ) : (
        <ul className="space-y-4">
          {announcements.map((a) => (
            <li key={a.id} className="rounded-2xl border border-slate-100 bg-white/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-slate-900">{a.title}</h3>
                  <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
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
                {canModerate && (
                  <IconButton
                    icon="delete"
                    label="Duyuruyu kaldır"
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

      <ConfirmDialog
        open={!!deleteTarget}
        title={`"${deleteTarget?.title}" kaldırılsın mı?`}
        description="Bu bir moderasyon işlemidir; duyuru geri getirilemez."
        confirmLabel="Kaldır"
        loading={deleteMutation.isPending}
        error={deleteMutation.isError ? getErrorMessage(deleteMutation.error, "Kaldırılamadı.") : null}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => {
          setDeleteTarget(null);
          deleteMutation.reset();
        }}
      />
    </section>
  );
}
