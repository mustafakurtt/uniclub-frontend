import { useState } from "react";
import SelectField from "@/shared/ui/SelectField";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getAdminClubs } from "@/features/admin/api";
import { MODERATION_PERMISSIONS } from "@/features/auth/authorization";
import { getErrorMessage } from "@/shared/api/client";
import { CLUB_STATUS_LABELS } from "@/features/clubs/labels";
import EmptyState from "@/shared/ui/EmptyState";
import RequireUniversity from "@/features/admin/components/RequireUniversity";
import ModerationMembersSection from "@/features/admin/components/moderation/ModerationMembersSection";
import ModerationAnnouncementsSection from "@/features/admin/components/moderation/ModerationAnnouncementsSection";
import ModerationGallerySection from "@/features/admin/components/moderation/ModerationGallerySection";

/**
 * Üye & içerik moderasyonu — tenant üstten müdahale (docs/FRONTEND_YONETIM.md §5.5).
 * Kulübün KENDİ officer/başkan katmanından bağımsız: `content_moderator` gibi
 * salt bu yetkileri taşıyan bir rolün bugüne kadar hiç kullanamadığı yüzey —
 * API'ler (`admin/api/moderation.ts`) hazırdı, UI eksikti.
 *
 * Akış: kulüp seç → o kulübün üyelerini/duyurularını/galerisini gör, gerekirse
 * kaldır. Listeleme `club.view`, her aksiyon kendi granüler yetkisiyle
 * (club.member.manage / announcement.moderate / gallery.moderate) korunur.
 */
function ModerationWorkspace({
  universityId,
  canManageMembers,
  canModerateAnnouncements,
  canModerateGallery,
}: {
  universityId: string;
  canManageMembers: boolean;
  canModerateAnnouncements: boolean;
  canModerateGallery: boolean;
}) {
  const [clubId, setClubId] = useState<string>("");

  const clubsQuery = useQuery({
    queryKey: ["admin", universityId, "clubs", "all"],
    queryFn: () => getAdminClubs(universityId),
  });

  const clubs = clubsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="input-label mb-0" htmlFor="moderation-club-select">
          Kulüp
        </label>
        <SelectField
          id="moderation-club-select"
          className="select-field w-auto max-w-xs py-1.5 text-sm font-semibold text-slate-700"
          value={clubId}
          onChange={(e) => setClubId(e.target.value)}
          disabled={clubsQuery.isLoading}
        >
          <option value="">Kulüp seçin…</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name} · {CLUB_STATUS_LABELS[club.status]}
            </option>
          ))}
        </SelectField>
      </div>

      {clubsQuery.isError ? (
        <div className="alert-error">{getErrorMessage(clubsQuery.error, "Kulüpler yüklenemedi.")}</div>
      ) : !clubId ? (
        <EmptyState
          icon="moderation"
          title="Moderasyon için bir kulüp seçin"
          description="Seçtiğin kulübün üyelerini, duyurularını ve galerisini burada inceleyip kaldırabilirsin."
        />
      ) : (
        <>
          <ModerationMembersSection
            key={`members-${clubId}`}
            universityId={universityId}
            clubId={clubId}
            canManage={canManageMembers}
          />
          <ModerationAnnouncementsSection
            key={`announcements-${clubId}`}
            universityId={universityId}
            clubId={clubId}
            canModerate={canModerateAnnouncements}
          />
          <ModerationGallerySection
            key={`gallery-${clubId}`}
            universityId={universityId}
            clubId={clubId}
            canModerate={canModerateGallery}
          />
        </>
      )}
    </div>
  );
}

export default function AdminModeration() {
  const { hasPermission } = useAuth();

  const canBrowseClubs = hasPermission("club.view");
  const canManageMembers = hasPermission("club.member.manage");
  const canModerateAnnouncements = hasPermission("announcement.moderate");
  const canModerateGallery = hasPermission("gallery.moderate");
  const hasAnyModerationPermission = MODERATION_PERMISSIONS.some((p) => hasPermission(p));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Moderasyon</h1>
        <p className="mt-1 text-sm text-slate-500">
          Bir kulübün üyelerine, duyurularına ve galerisine tenant üstünden müdahale et.
        </p>
      </div>

      {!canBrowseClubs || !hasAnyModerationPermission ? (
        <div className="alert-error">Bu bölüm için gerekli yetkin bulunmuyor.</div>
      ) : (
        <RequireUniversity>
          {(universityId) => (
            <ModerationWorkspace
              universityId={universityId}
              canManageMembers={canManageMembers}
              canModerateAnnouncements={canModerateAnnouncements}
              canModerateGallery={canModerateGallery}
            />
          )}
        </RequireUniversity>
      )}
    </div>
  );
}
