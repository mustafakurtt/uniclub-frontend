import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listUniversityAnnouncements } from "@/features/university-announcements/api/universityAnnouncements";
import UniversityAnnouncementFormModal from "@/features/university-announcements/components/UniversityAnnouncementFormModal";
import UniversityAnnouncementAdminRow from "@/features/university-announcements/components/UniversityAnnouncementAdminRow";
import { getErrorMessage } from "@/shared/api/client";
import { isScheduledDraft } from "@/shared/lib/publishState";
import EmptyState from "@/shared/ui/EmptyState";
import PageLoader from "@/shared/ui/PageLoader";
import { Icon } from "@/shared/ui/Icon";

import { universityAnnouncementsQueryKey } from "@/features/university-announcements/queries";

interface Props {
  universityId: string;
}

export default function AdminUniversityAnnouncementsBody({ universityId }: Props) {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);

  const announcementsQuery = useQuery({
    queryKey: universityAnnouncementsQueryKey(universityId),
    queryFn: () => listUniversityAnnouncements(universityId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: universityAnnouncementsQueryKey(universityId) });

  if (announcementsQuery.isLoading) {
    return <PageLoader label="Okul duyuruları yükleniyor…" />;
  }

  if (announcementsQuery.isError) {
    return (
      <div className="alert-error">
        {getErrorMessage(announcementsQuery.error, "Duyurular yüklenemedi.")}
      </div>
    );
  }

  const announcements = announcementsQuery.data ?? [];
  const scheduledDrafts = announcements.filter((a) => isScheduledDraft(a));
  const plainDrafts = announcements.filter((a) => a.status === "draft" && !isScheduledDraft(a));
  const published = announcements.filter((a) => a.status === "published");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900">Okul duyuruları</h1>
          <p className="mt-1 text-sm text-slate-500">
            Üniversite genelinde yayınlanan duyurular. Taslak ve zamanlanmış kayıtlar yalnızca
            burada görünür; öğrenciler yalnızca yayınlanmışları görür.
          </p>
        </div>
        <button type="button" className="btn-primary text-sm" onClick={() => setCreating(true)}>
          <Icon name="add" size={14} /> Yeni duyuru
        </button>
      </div>

      {announcements.length === 0 ? (
        <EmptyState
          icon="announcement"
          title="Henüz okul duyurusu yok"
          description="İlk duyuruyu oluştururken yayın zamanını dikkatle seçin."
        />
      ) : (
        <div className="space-y-8">
          {scheduledDrafts.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-violet-600">
                Zamanlanmış taslaklar
              </h2>
              <ul className="space-y-4">
                {scheduledDrafts.map((a) => (
                  <UniversityAnnouncementAdminRow
                    key={a.id}
                    universityId={universityId}
                    announcement={a}
                    onUpdated={invalidate}
                  />
                ))}
              </ul>
            </section>
          )}
          {plainDrafts.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                Taslaklar
              </h2>
              <ul className="space-y-4">
                {plainDrafts.map((a) => (
                  <UniversityAnnouncementAdminRow
                    key={a.id}
                    universityId={universityId}
                    announcement={a}
                    onUpdated={invalidate}
                  />
                ))}
              </ul>
            </section>
          )}
          {published.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-emerald-600">
                Yayında
              </h2>
              <ul className="space-y-4">
                {published.map((a) => (
                  <UniversityAnnouncementAdminRow
                    key={a.id}
                    universityId={universityId}
                    announcement={a}
                    onUpdated={invalidate}
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <UniversityAnnouncementFormModal
        open={creating}
        universityId={universityId}
        onSaved={invalidate}
        onClose={() => setCreating(false)}
      />
    </div>
  );
}
