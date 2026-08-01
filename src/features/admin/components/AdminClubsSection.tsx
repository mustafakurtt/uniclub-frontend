import { useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SelectField from "@/shared/ui/SelectField";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import IconButton from "@/shared/ui/IconButton";
import RequirePermission from "@/features/auth/guards/RequirePermission";
import { useAuth } from "@/features/auth/hooks/useAuth";
import ClubFormModal from "@/features/clubs/components/ClubFormModal";
import ClubAdvisorsModal from "@/features/admin/components/ClubAdvisorsModal";
import {
  adminUpdateClub,
  deleteAdminClub,
  getAdminClubs,
  updateClubStatus,
  type AdminUpdateClubDto,
} from "@/features/admin/api";
import { adminClubDetailHref } from "@/features/admin/adminListNav";
import { getErrorMessage } from "@/shared/api/client";
import { CLUB_STATUS_LABELS, JOIN_POLICY_LABELS } from "@/features/clubs/labels";
import type { Club, ClubStatus } from "@/shared/types";

// Admin kulüp yönetimi (FRONTEND_CLUBS.md §11) — granüler yetkiler:
//  • listeleme/durum/profil → club.update
//  • danışmanlar → club.advisor.manage
//  • kalıcı silme → club.delete (yalnızca archived/rejected; cascade temizlik)
// Bölüm yalnızca club.update olan kullanıcıya render edilmelidir (sayfa karar verir).

const STATUS_FILTERS: { key: ClubStatus | "all"; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "approved", label: "Aktif" },
  { key: "pending", label: "Bekleyen" },
  { key: "archived", label: "Arşiv" },
  { key: "rejected", label: "Reddedilen" },
];

const STATUS_CHIP_CLASSES: Record<ClubStatus, string> = {
  approved: "bg-green-50 text-green-700 border-green-100",
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  archived: "bg-slate-100 text-slate-600 border-slate-200",
  rejected: "bg-red-50 text-red-700 border-red-100",
};

function parseClubStatus(value: string | null): ClubStatus | "all" {
  if (value === "approved" || value === "pending" || value === "archived" || value === "rejected") {
    return value;
  }
  return "all";
}

interface AdminClubsSectionProps {
  universityId: string;
}

export default function AdminClubsSection({ universityId }: AdminClubsSectionProps) {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = parseClubStatus(searchParams.get("clubStatus"));
  const canUpdate = hasPermission("club.update");
  const [editTarget, setEditTarget] = useState<Club | null>(null);
  const [advisorsTarget, setAdvisorsTarget] = useState<Club | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Club | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const setStatusFilter = useCallback(
    (status: ClubStatus | "all") => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (status === "all") params.delete("clubStatus");
        else params.set("clubStatus", status);
        return params;
      });
    },
    [setSearchParams]
  );

  const clubsQuery = useQuery({
    queryKey: ["admin", universityId, "clubs", statusFilter],
    queryFn: () => getAdminClubs(universityId, statusFilter === "all" ? undefined : statusFilter),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", universityId, "clubs"] });
    // Üye tarafındaki keşif listesi de aynı veriden beslenir
    queryClient.invalidateQueries({ queryKey: ["clubs"] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ clubId, status }: { clubId: string; status: ClubStatus }) =>
      updateClubStatus(universityId, clubId, status),
    onSuccess: invalidate,
    onError: (error) => setStatusError(getErrorMessage(error, "Durum güncellenemedi.")),
  });

  const editMutation = useMutation({
    mutationFn: ({ clubId, dto }: { clubId: string; dto: AdminUpdateClubDto }) =>
      adminUpdateClub(universityId, clubId, dto),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (clubId: string) => deleteAdminClub(universityId, clubId),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  const clubs = clubsQuery.data ?? [];

  return (
    <section className="card p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="icon-tile"><Icon name="university" size={24} className="text-brand-600" /></span>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Kulüpler</h2>
            <p className="text-xs text-slate-500">
              Silme yalnızca arşivlenmiş/reddedilmiş kulüpler için — önce arşivle.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                statusFilter === f.key
                  ? "bg-brand-600 text-white shadow-glow"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-brand-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {statusError && (
        <div className="alert-error mb-4 flex items-center justify-between gap-3">
          <span>{statusError}</span>
          <IconButton icon="close" label="Kapat" tone="danger" onClick={() => setStatusError(null)} />
        </div>
      )}

      {clubsQuery.isLoading ? (
        <div className="space-y-3">
          <div className="skeleton h-14 w-full" />
          <div className="skeleton h-14 w-full" />
        </div>
      ) : clubsQuery.isError ? (
        <div className="alert-error">{getErrorMessage(clubsQuery.error, "Kulüpler yüklenemedi.")}</div>
      ) : clubs.length === 0 ? (
        <EmptyState icon="university" title="Bu filtrede kulüp yok" />
      ) : (
        <ul className="divide-y divide-slate-100">
          {clubs.map((club) => {
            const deletable = club.status === "archived" || club.status === "rejected";
            return (
              <li key={club.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <Link
                  to={adminClubDetailHref(club.id, {
                    clubStatus: statusFilter === "all" ? null : statusFilter,
                  })}
                  className="flex min-w-0 flex-1 items-center gap-3 transition-colors hover:opacity-80"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-600 to-accent-400 font-display text-sm font-extrabold text-white">
                    {club.logoUrl ? (
                      <img src={club.logoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      club.name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-bold text-slate-900">{club.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_CHIP_CLASSES[club.status]}`}
                      >
                        {CLUB_STATUS_LABELS[club.status]}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {JOIN_POLICY_LABELS[club.joinPolicy]}
                      </span>
                    </div>
                  </div>
                  <Icon name="chevronRight" size={16} className="shrink-0 text-slate-300" />
                </Link>

                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  {canUpdate ? (
                    <SelectField
                      className="select-field w-auto py-1.5 pr-9 text-xs font-semibold text-slate-600"
                      value={club.status}
                      disabled={statusMutation.isPending}
                      onChange={(e) =>
                        statusMutation.mutate({ clubId: club.id, status: e.target.value as ClubStatus })
                      }
                      aria-label="Kulüp durumu"
                    >
                      {(Object.keys(CLUB_STATUS_LABELS) as ClubStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {CLUB_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </SelectField>
                  ) : (
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_CHIP_CLASSES[club.status]}`}
                    >
                      {CLUB_STATUS_LABELS[club.status]}
                    </span>
                  )}
                  <RequirePermission permission="club.update">
                    <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setEditTarget(club)}>
                      <Icon name="edit" size={14} /> Düzenle
                    </button>
                  </RequirePermission>
                  <RequirePermission permission="club.advisor.manage">
                    <button
                      className="btn-ghost px-3 py-1.5 text-xs"
                      onClick={() => setAdvisorsTarget(club)}
                    >
                      <Icon name="advisor" size={14} /> Danışmanlar
                    </button>
                  </RequirePermission>
                  <RequirePermission permission="club.delete">
                    <button
                      className="btn-ghost px-2.5 py-1.5 text-slate-400 hover:text-red-600 disabled:opacity-40"
                      disabled={!deletable}
                      title={deletable ? "Kalıcı sil" : "Önce kulübü arşivle"}
                      aria-label="Kulübü kalıcı sil"
                      onClick={() => setDeleteTarget(club)}
                    >
                      <Icon name="delete" size={16} />
                    </button>
                  </RequirePermission>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Profil düzenleme — başkanın formuyla aynı bileşen, admin ucuna bağlanır */}
      <ClubFormModal
        key={editTarget?.id ?? "none"}
        open={!!editTarget}
        title={`Kulübü Düzenle — ${editTarget?.name ?? ""}`}
        defaultValues={{
          name: editTarget?.name ?? "",
          description: editTarget?.description ?? "",
          logoUrl: editTarget?.logoUrl ?? "",
          coverUrl: editTarget?.coverUrl ?? "",
          joinPolicy: editTarget?.joinPolicy ?? "open",
        }}
        onSubmit={(dto) => editMutation.mutateAsync({ clubId: editTarget!.id, dto })}
        onClose={() => setEditTarget(null)}
      />

      <ClubAdvisorsModal
        open={!!advisorsTarget}
        universityId={universityId}
        club={advisorsTarget}
        onClose={() => setAdvisorsTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`"${deleteTarget?.name}" KALICI olarak silinsin mi?`}
        description="Üyeler, danışmanlar, linkler, duyurular ve galeri tek işlemde temizlenir. Bu işlem geri alınamaz."
        confirmLabel="Kalıcı Olarak Sil"
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
