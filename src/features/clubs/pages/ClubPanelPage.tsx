import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClub } from "@/features/clubs/api/clubs";
import { getClubDashboard, listHandoverRecords } from "@/features/clubs/api/clubPanel";
import { getCurrentBoard } from "@/features/clubs/api/generalMeetings";
import ClubHandoverSection from "@/features/clubs/components/ClubHandoverSection";
import RequireClubStaffRoute from "@/features/clubs/guards/RequireClubStaffRoute";
import { boardHasMembers, currentBoardToMeetingMembers } from "@/features/clubs/clubBoard";
import GeneralMeetingBoardSection from "@/features/clubs/components/GeneralMeetingBoardSection";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useClubRole } from "@/features/clubs/hooks/useClubRole";
import PageLoader from "@/shared/ui/PageLoader";
import { Icon } from "@/shared/ui/Icon";
import { getErrorMessage } from "@/shared/api/client";

function ClubPanelContent() {
  const { clubId = "" } = useParams();
  const { user, clubMemberships } = useAuth();
  const myRole = useClubRole(clubId);
  const isOfficer = myRole === "officer" || myRole === "president";
  const isApprovedMember = clubMemberships.some(
    (m) => m.clubId === clubId && m.status === "approved",
  );

  const clubQuery = useQuery({
    queryKey: ["clubs", clubId],
    queryFn: () => getClub(clubId),
    enabled: !!clubId,
  });

  const dashboardQuery = useQuery({
    queryKey: ["clubs", clubId, "dashboard"],
    queryFn: () => getClubDashboard(clubId),
    enabled: !!clubId,
  });

  const boardQuery = useQuery({
    queryKey: ["clubs", clubId, "current-board"],
    queryFn: () => getCurrentBoard(clubId),
    enabled: !!clubId && isApprovedMember,
  });

  const handoverQuery = useQuery({
    queryKey: ["clubs", clubId, "handover-records"],
    queryFn: () => listHandoverRecords(clubId),
    enabled: !!clubId,
  });

  if (clubQuery.isLoading) {
    return <PageLoader label="Kulüp paneli yükleniyor..." />;
  }

  if (clubQuery.isError || !clubQuery.data) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-600">{getErrorMessage(clubQuery.error, "Kulüp bulunamadı.")}</p>
        <Link to="/clubs" className="btn-primary mt-4 inline-flex">
          Kulüplere dön
        </Link>
      </div>
    );
  }

  const club = clubQuery.data;
  const stats = dashboardQuery.data;

  return (
    <div className="space-y-8">
      <div>
        <Link
          to={`/clubs/${clubId}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-700"
        >
          <Icon name="arrowLeft" size={16} /> {club.name}
        </Link>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-slate-900">Kulüp paneli</h1>
        <p className="mt-1 text-sm text-slate-500">
          Üyelik, etkinlik ve devir işlemlerinin özeti — yalnızca kulüp yetkililerine görünür.
        </p>
      </div>

      {dashboardQuery.isLoading && <div className="skeleton h-24 w-full" />}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Onaylı üye", value: stats.memberCount, icon: "members" as const },
            { label: "Bekleyen istek", value: stats.pendingJoinRequests, icon: "pending" as const },
            {
              label: "Yaklaşan etkinlik",
              value: stats.upcomingActivityCount,
              icon: "calendar" as const,
            },
            { label: "Duyuru", value: stats.announcementCount, icon: "announcement" as const },
          ].map((item) => (
            <div key={item.label} className="card p-4">
              <div className="flex items-center gap-2 text-slate-500">
                <Icon name={item.icon} size={16} className="text-brand-500" />
                <span className="text-xs font-bold uppercase tracking-wide">{item.label}</span>
              </div>
              <p className="mt-2 font-display text-2xl font-extrabold text-slate-900">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {dashboardQuery.isError && (
        <div className="alert-error text-sm">
          {getErrorMessage(dashboardQuery.error, "Panel özeti yüklenemedi.")}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link to={`/clubs/${clubId}`} className="btn-secondary text-sm">
          Kulüp sayfasına git
        </Link>
      </div>

      {isApprovedMember && (
        <section className="card p-6">
          <h2 className="font-display text-lg font-extrabold text-slate-900">Güncel kurul</h2>
          <p className="mt-1 mb-4 text-sm text-slate-500">Asil ve yedek üyeler, unvanlarıyla.</p>
          {boardQuery.isLoading && <div className="skeleton h-32 w-full" />}
          {boardQuery.isError && (
            <p className="text-sm text-slate-500">
              {getErrorMessage(boardQuery.error, "Kurul listesi yüklenemedi.")}
            </p>
          )}
          {boardQuery.data && !boardHasMembers(boardQuery.data) && (
            <p className="text-sm text-slate-500">
              Henüz aktif kurul kaydı yok. Genel kurul toplantısı kaydında kurul seçimi yapıldığında
              burada görünür.
            </p>
          )}
          {boardQuery.data && boardHasMembers(boardQuery.data) && (
            <GeneralMeetingBoardSection members={currentBoardToMeetingMembers(boardQuery.data)} />
          )}
        </section>
      )}

      {!isApprovedMember && (
        <p className="text-sm text-slate-500">
          Güncel kurul listesi yalnızca onaylı kulüp üyelerine gösterilir.
        </p>
      )}

      {user?.universityId && (
        <ClubHandoverSection
          clubId={clubId}
          universityId={user.universityId}
          records={handoverQuery.data ?? []}
          canCreate={isOfficer}
          isLoading={handoverQuery.isLoading}
        />
      )}
    </div>
  );
}

export default function ClubPanelPage() {
  return (
    <RequireClubStaffRoute>
      <ClubPanelContent />
    </RequireClubStaffRoute>
  );
}
