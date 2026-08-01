import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { adminClubsListHrefFromClub } from "@/features/admin/adminListNav";
import ActivitiesTab from "@/features/admin/components/club-detail/ActivitiesTab";
import AdvisorsTab from "@/features/admin/components/club-detail/AdvisorsTab";
import AnnouncementsTab from "@/features/admin/components/club-detail/AnnouncementsTab";
import AuditTab from "@/features/admin/components/club-detail/AuditTab";
import GalleryTab from "@/features/admin/components/club-detail/GalleryTab";
import GeneralMeetingsTab from "@/features/admin/components/club-detail/GeneralMeetingsTab";
import MembersTab from "@/features/admin/components/club-detail/MembersTab";
import MembershipHistoryTab from "@/features/admin/components/club-detail/MembershipHistoryTab";
import {
  CLUB_DETAIL_TABS,
  parseClubDetailTab,
  type ClubDetailTab,
} from "@/features/admin/components/club-detail/clubDetailTabs";
import ClubAdvisorsModal from "@/features/admin/components/ClubAdvisorsModal";
import ClubManagementBoardSummary from "@/features/clubs/components/ClubManagementBoardSummary";
import RequireUniversity from "@/features/admin/components/RequireUniversity";
import { getAdminClub } from "@/features/admin/api";
import RequirePermission from "@/features/auth/guards/RequirePermission";
import { useAuth } from "@/features/auth/hooks/useAuth";
import Forbidden from "@/features/auth/pages/Forbidden";
import { CLUB_STATUS_LABELS, JOIN_POLICY_LABELS } from "@/features/clubs/labels";
import PageLoader from "@/shared/ui/PageLoader";
import { Icon } from "@/shared/ui/Icon";
import { useState } from "react";
import type { AdminClubDetail } from "@/shared/types";

function CountBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white/80 px-3 py-2 text-center">
      <p className="font-display text-lg font-extrabold text-slate-900">{value}</p>
      <p className="text-[11px] font-semibold text-slate-400">{label}</p>
    </div>
  );
}

function ClubDetailBody({
  universityId,
  clubId,
  club,
}: {
  universityId: string;
  clubId: string;
  club: AdminClubDetail;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission, isClubStaff, clubRoleOf } = useAuth();
  const [advisorsOpen, setAdvisorsOpen] = useState(false);

  const clubStatus = searchParams.get("clubStatus");
  const tab = parseClubDetailTab(searchParams.get("tab"));
  const backHref = adminClubsListHrefFromClub(clubStatus);

  const setTab = useCallback(
    (next: ClubDetailTab) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set("tab", next);
        return params;
      });
    },
    [setSearchParams]
  );

  const canManageMembers = hasPermission("club.member.manage");
  const canViewMembershipHistory = canManageMembers || isClubStaff(clubId);
  const canViewGeneralMeetings = canViewMembershipHistory;
  const clubRole = clubRoleOf(clubId);
  const canCreateGeneralMeeting =
    isClubStaff(clubId) && (clubRole === "officer" || clubRole === "president");
  const canManageAdvisors = hasPermission("club.advisor.manage");
  const canModerateAnnouncements = hasPermission("announcement.moderate");
  const canModerateGallery = hasPermission("gallery.moderate");
  const advisorVacant = club.counts.advisors === 0;

  const visibleTabs = CLUB_DETAIL_TABS.filter((t) => {
    if (t.key === "audit") return hasPermission("audit.view");
    if (t.key === "membership-history") return canViewMembershipHistory;
    if (t.key === "general-meetings") return canViewGeneralMeetings;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <Link to={backHref} className="btn-ghost mb-4 px-0 text-sm">
          <Icon name="arrowLeft" size={14} /> Kulüp listesine dön
        </Link>
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-accent-400 font-display text-xl font-extrabold text-white">
            {club.logoUrl ? (
              <img src={club.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              club.name.charAt(0).toUpperCase()
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-extrabold text-slate-900">{club.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="chip">{CLUB_STATUS_LABELS[club.status]}</span>
              <span>{JOIN_POLICY_LABELS[club.joinPolicy]}</span>
              <span className="font-mono text-slate-400">/{club.slug}</span>
            </div>
            {club.description && (
              <p className="mt-3 max-w-2xl text-sm text-slate-600 whitespace-pre-wrap">
                {club.description}
              </p>
            )}
            {advisorVacant && (
              <div className="alert-error mt-4 flex items-start gap-2 text-sm">
                <Icon name="advisor" size={16} className="mt-0.5 shrink-0" />
                <p>
                  <span className="font-semibold">Danışmansız kulüp.</span> Aktif danışman
                  atanana kadar kurumsal süreçler eksik sayılır.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <CountBadge label="Üye" value={club.counts.members} />
          <CountBadge label="Bekleyen istek" value={club.counts.pendingJoinRequests} />
          <CountBadge label="Yaklaşan etkinlik" value={club.counts.upcomingActivities} />
          <CountBadge label="Danışman" value={club.counts.advisors} />
        </div>
        {canViewGeneralMeetings && (
          <ClubManagementBoardSummary clubId={clubId} enabled={canViewGeneralMeetings} />
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-1">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
              tab === t.key
                ? "bg-brand-600 text-white shadow-glow"
                : "bg-white text-slate-500 border border-slate-200 hover:border-brand-400"
            }`}
          >
            {t.label}
          </button>
        ))}
        {tab === "advisors" && canManageAdvisors && (
          <button type="button" className="btn-ghost ml-auto text-xs" onClick={() => setAdvisorsOpen(true)}>
            <Icon name="advisor" size={14} /> Danışman davet et
          </button>
        )}
      </div>

      <section className="card p-5">
        {tab === "members" && (
          <MembersTab
            universityId={universityId}
            clubId={clubId}
            canManage={canManageMembers}
            enabled={tab === "members"}
          />
        )}
        {tab === "membership-history" && canViewMembershipHistory && (
          <MembershipHistoryTab
            universityId={universityId}
            clubId={clubId}
            enabled={tab === "membership-history"}
          />
        )}
        {tab === "general-meetings" && canViewGeneralMeetings && (
          <GeneralMeetingsTab
            universityId={universityId}
            clubId={clubId}
            enabled={tab === "general-meetings"}
            canCreate={canCreateGeneralMeeting}
          />
        )}
        {tab === "activities" && (
          <ActivitiesTab universityId={universityId} clubId={clubId} enabled={tab === "activities"} />
        )}
        {tab === "announcements" && (
          <AnnouncementsTab
            universityId={universityId}
            clubId={clubId}
            canModerate={canModerateAnnouncements}
            enabled={tab === "announcements"}
          />
        )}
        {tab === "advisors" && (
          <AdvisorsTab
            universityId={universityId}
            clubId={clubId}
            enabled={tab === "advisors"}
            advisorVacant={advisorVacant}
            canManage={canManageAdvisors}
            onInvite={canManageAdvisors ? () => setAdvisorsOpen(true) : undefined}
          />
        )}
        {tab === "gallery" && (
          <GalleryTab
            universityId={universityId}
            clubId={clubId}
            canModerate={canModerateGallery}
            enabled={tab === "gallery"}
          />
        )}
        {tab === "audit" && hasPermission("audit.view") && (
          <AuditTab universityId={universityId} clubId={clubId} enabled={tab === "audit"} />
        )}
      </section>

      <ClubAdvisorsModal
        open={advisorsOpen}
        universityId={universityId}
        club={club}
        onClose={() => setAdvisorsOpen(false)}
      />
    </div>
  );
}

export default function AdminClubDetail() {
  const { clubId } = useParams<{ clubId: string }>();

  if (!clubId) {
    return <div className="alert-error">Geçersiz kulüp bağlantısı.</div>;
  }

  return (
    <RequirePermission permission="club.view" fallback={<Forbidden />}>
      <RequireUniversity>
        {(universityId) => <ClubDetailLoader universityId={universityId} clubId={clubId} />}
      </RequireUniversity>
    </RequirePermission>
  );
}

function ClubDetailLoader({ universityId, clubId }: { universityId: string; clubId: string }) {
  const detailQuery = useQuery({
    queryKey: ["admin", universityId, "club", clubId],
    queryFn: () => getAdminClub(universityId, clubId),
  });

  if (detailQuery.isLoading) {
    return <PageLoader label="Kulüp yükleniyor…" />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="card p-8 text-center">
        <Icon name="notFound" size={40} className="mx-auto mb-3 text-slate-400" />
        <p className="font-semibold text-slate-700">Kulüp bulunamadı.</p>
        <Link to="/admin/clubs" className="btn-ghost mt-4 inline-flex">
          Listeye dön
        </Link>
      </div>
    );
  }

  return (
    <ClubDetailBody universityId={universityId} clubId={clubId} club={detailQuery.data} />
  );
}
