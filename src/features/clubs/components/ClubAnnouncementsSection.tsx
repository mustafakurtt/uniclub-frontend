import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAnnouncements } from "@/features/clubs/api/clubs";
import { getErrorMessage } from "@/shared/api/client";
import AnnouncementFormModal from "@/features/clubs/components/announcements/AnnouncementFormModal";
import AnnouncementRow from "@/features/clubs/components/announcements/AnnouncementRow";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";

// Duyurular (FRONTEND_CLUBS.md §9.1). Okuma herkese açık; yazma/silme "staff"
// (danışman/officer/başkan) yetkisidir — danışman da içerik girebilir (§10).

interface ClubAnnouncementsSectionProps {
  clubId: string;
  /** staff (danışman/officer/başkan) → oluşturma ve yönetim butonları görünür */
  canManage: boolean;
}

export default function ClubAnnouncementsSection({ clubId, canManage }: ClubAnnouncementsSectionProps) {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);

  const announcementsQuery = useQuery({
    queryKey: ["clubs", clubId, "announcements"],
    queryFn: () => getAnnouncements(clubId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["clubs", clubId, "announcements"] });

  const announcements = announcementsQuery.data ?? [];
  const drafts = canManage ? announcements.filter((a) => a.status === "draft") : [];
  const published = announcements.filter((a) => a.status === "published");

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="icon-tile">
            <Icon name="announcement" size={24} className="text-brand-600" />
          </span>
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
        <div className="space-y-6">
          {canManage && drafts.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                Taslaklar (yalnızca staff görür)
              </h3>
              <ul className="space-y-4">
                {drafts.map((a) => (
                  <AnnouncementRow
                    key={a.id}
                    clubId={clubId}
                    announcement={a}
                    canManage={canManage}
                    onUpdated={invalidate}
                  />
                ))}
              </ul>
            </div>
          )}
          {published.length > 0 ? (
            <ul className="space-y-4">
              {published.map((a) => (
                <AnnouncementRow
                  key={a.id}
                  clubId={clubId}
                  announcement={a}
                  canManage={canManage}
                  onUpdated={invalidate}
                />
              ))}
            </ul>
          ) : (
            canManage &&
            drafts.length === 0 && (
              <EmptyState icon="announcement" title="Yayınlanmış duyuru yok" />
            )
          )}
        </div>
      )}

      <AnnouncementFormModal
        open={creating}
        clubId={clubId}
        onSaved={invalidate}
        onClose={() => setCreating(false)}
      />
    </section>
  );
}
