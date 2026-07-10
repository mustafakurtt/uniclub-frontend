import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClub, joinClub, leaveClub, updateClub } from "@/features/clubs/api/clubs";
import { getErrorMessage } from "@/shared/api/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import PageLoader from "@/shared/ui/PageLoader";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import Reveal from "@/shared/ui/Reveal";
import ClubFormModal from "@/features/clubs/components/ClubFormModal";
import ClubMembersSection from "@/features/clubs/components/ClubMembersSection";
import ClubJoinRequestsSection from "@/features/clubs/components/ClubJoinRequestsSection";
import ClubAnnouncementsSection from "@/features/clubs/components/ClubAnnouncementsSection";
import ClubGallerySection from "@/features/clubs/components/ClubGallerySection";
import ClubContactLinksSection from "@/features/clubs/components/ClubContactLinksSection";
import { Icon } from "@/shared/ui/Icon";
import { CLUB_ROLE_ICONS, CLUB_ROLE_LABELS, JOIN_POLICY_ICONS, JOIN_POLICY_LABELS } from "@/features/clubs/labels";

/**
 * Kulüp detay sayfası — /clubs/:clubId (docs/FRONTEND_CLUBS.md §5.1).
 * Sayfa yalnızca kompozisyon yapar; her bölüm kendi verisini/mutasyonlarını yönetir.
 *
 * Rol katmanları (§1): guard'lar UX içindir, gerçek kontrol backend'dedir.
 *  • herkes: detay, üyeler, duyurular, galeri, katıl/ayrıl
 *  • staff (danışman/officer/başkan): duyuru/galeri yazma + istek görüntüleme
 *  • officer/başkan: istek kararı, üye çıkarma, link yönetimi
 *  • yalnızca başkan: rol atama, başkanlık devri, kulüp profili
 */
export default function ClubDetail() {
  const { clubId = "" } = useParams();
  const queryClient = useQueryClient();
  const { user, clubMemberships, clubRoleOf, isAdvisorOf, isClubStaff } = useAuth();
  const [editing, setEditing] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const clubQuery = useQuery({
    queryKey: ["clubs", clubId],
    queryFn: () => getClub(clubId),
    enabled: !!clubId,
  });

  const invalidateMembership = () => {
    queryClient.invalidateQueries({ queryKey: ["clubs", clubId] });
    queryClient.invalidateQueries({ queryKey: ["auth", "clubMemberships"] });
  };

  const joinMutation = useMutation({
    mutationFn: () => joinClub(clubId),
    onSuccess: invalidateMembership,
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveClub(clubId),
    onSuccess: () => {
      invalidateMembership();
      setLeaving(false);
    },
  });

  const editMutation = useMutation({
    mutationFn: (dto: Parameters<typeof updateClub>[1]) => updateClub(clubId, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clubs", clubId] }),
  });

  if (clubQuery.isLoading) {
    return <PageLoader label="Kulüp yükleniyor..." />;
  }

  if (clubQuery.isError || !clubQuery.data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="card-gradient p-10 text-center max-w-md animate-scale-in">
          <Icon name="notFound" size={40} className="mx-auto mb-4 text-brand-500" />
          <p className="text-slate-700 font-semibold mb-2">
            {getErrorMessage(clubQuery.error, "Kulüp bulunamadı.")}
          </p>
          <Link to="/clubs" className="btn-primary mt-4 inline-flex"><Icon name="arrowLeft" size={16} /> Kulüplere Dön</Link>
        </div>
      </div>
    );
  }

  const club = clubQuery.data;
  const myRole = clubRoleOf(clubId);
  const isAdvisor = isAdvisorOf(clubId);
  const isStaff = isClubStaff(clubId);
  const isOfficer = myRole === "officer" || myRole === "president";
  const isPresident = myRole === "president";
  const membership = clubMemberships.find((m) => m.clubId === clubId);
  const hasPendingRequest = membership?.status === "pending";
  const isApprovedMember = membership?.status === "approved";

  return (
    <div className="space-y-8">
      <Link to="/clubs" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-700">
        <Icon name="arrowLeft" size={16} /> Kulüpler
      </Link>

      {/* ====== HERO ====== */}
      <Reveal>
        <div className="card overflow-hidden">
          <div className="relative h-44 bg-gradient-to-br from-brand-800 to-accent-600 md:h-56">
            {club.coverUrl && <img src={club.coverUrl} alt="" className="h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-grid-fine-dark bg-grid-sm opacity-30" aria-hidden />
            {/* Başlık/çipler kapağın üstüne taşar (-mt); görsel ne olursa olsun
                okunur kalsınlar diye alttan beyaza akan tül. */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/70 to-transparent" aria-hidden />
          </div>

          <div className="relative px-6 pb-6 md:px-10">
            <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-card ring-4 ring-white">
                  {club.logoUrl ? (
                    <img src={club.logoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display text-4xl font-extrabold text-gradient">
                      {club.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="pb-1">
                  <h1 className="font-display text-2xl font-extrabold text-slate-900 md:text-3xl">
                    {club.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="chip gap-1.5">
                      <Icon name={JOIN_POLICY_ICONS[club.joinPolicy]} size={13} className="text-brand-600" />
                      {JOIN_POLICY_LABELS[club.joinPolicy]}
                    </span>
                    {myRole && (
                      <span className="chip gap-1.5">
                        <Icon name={CLUB_ROLE_ICONS[myRole]} size={13} className="text-brand-600" />
                        {CLUB_ROLE_LABELS[myRole]}
                      </span>
                    )}
                    {isAdvisor && (
                      <span className="chip gap-1.5">
                        <Icon name="advisor" size={13} className="text-brand-600" /> Danışmanısın
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Aksiyonlar — üyelik durumuna göre (§5.3-5.4) */}
              <div className="flex flex-wrap items-center gap-2 pb-1">
                {isPresident && (
                  <button className="btn-secondary text-xs" onClick={() => setEditing(true)}>
                    <Icon name="edit" size={14} /> Kulübü Düzenle
                  </button>
                )}
                {!membership && !isAdvisor && (
                  <button
                    className="btn-primary text-sm"
                    disabled={joinMutation.isPending}
                    onClick={() => joinMutation.mutate()}
                  >
                    {joinMutation.isPending
                      ? "Gönderiliyor..."
                      : club.joinPolicy === "open"
                        ? "Kulübe Katıl"
                        : "Katılma İsteği Gönder"}
                  </button>
                )}
                {hasPendingRequest && (
                  <span className="chip animate-pulse-soft gap-1.5">
                    <Icon name="pending" size={13} className="text-brand-600" /> İsteğin onay bekliyor
                  </span>
                )}
                {isApprovedMember && !isPresident && (
                  <button
                    className="btn-ghost text-xs text-slate-400 hover:text-red-600"
                    onClick={() => setLeaving(true)}
                  >
                    Kulüpten Ayrıl
                  </button>
                )}
                {isPresident && (
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400"
                    title="Başkan, başkanlığı devretmeden kulüpten ayrılamaz."
                  >
                    <Icon name="president" size={13} /> Ayrılmak için önce başkanlığı devret
                  </span>
                )}
              </div>
            </div>

            {joinMutation.isError && (
              <div className="alert-error mt-4">
                {getErrorMessage(joinMutation.error, "Kulübe katılınamadı.")}
              </div>
            )}

            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-600">
              {club.description || "Bu kulüp için henüz bir açıklama eklenmemiş."}
            </p>

            {club.advisors.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Danışmanlar
                </span>
                {club.advisors.map((a) => (
                  <span key={a.id} className="chip gap-1.5">
                    <Icon name="advisor" size={13} className="text-brand-600" /> {a.firstName} {a.lastName}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Reveal>

      {/* ====== İÇERİK IZGARASI ====== */}
      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="space-y-6 lg:col-span-2">
          {/* İstek listesi staff'a görünür; kararı yalnızca officer/başkan verir (§7.1-7.2) */}
          {isStaff && <ClubJoinRequestsSection clubId={clubId} canDecide={isOfficer} />}
          <ClubAnnouncementsSection clubId={clubId} canManage={isStaff} />
          <ClubGallerySection clubId={clubId} canManage={isStaff} />
        </div>

        <div className="space-y-6">
          <ClubContactLinksSection clubId={clubId} links={club.contactLinks} canManage={isOfficer} />
          <ClubMembersSection
            clubId={clubId}
            members={club.clubMembers}
            myRole={myRole}
            myUserId={user?.id}
          />
        </div>
      </div>

      {/* Başkan: profil düzenleme (durum HARİÇ — §8.1) */}
      <ClubFormModal
        open={editing}
        title="Kulübü Düzenle"
        description="Kulüp durumu (onay/arşiv) okul yönetimine aittir; buradan değiştirilemez."
        defaultValues={{
          name: club.name,
          description: club.description ?? "",
          logoUrl: club.logoUrl ?? "",
          coverUrl: club.coverUrl ?? "",
          joinPolicy: club.joinPolicy,
        }}
        onSubmit={(dto) => editMutation.mutateAsync(dto)}
        onClose={() => setEditing(false)}
      />

      <ConfirmDialog
        open={leaving}
        title={`"${club.name}" kulübünden ayrılmak istiyor musun?`}
        description="Onay gerektiren kulüplerde geri dönmek için yeniden istek göndermen gerekir."
        confirmLabel="Ayrıl"
        loading={leaveMutation.isPending}
        error={leaveMutation.isError ? getErrorMessage(leaveMutation.error, "Ayrılınamadı.") : null}
        onConfirm={() => leaveMutation.mutate()}
        onClose={() => {
          setLeaving(false);
          leaveMutation.reset();
        }}
      />
    </div>
  );
}
