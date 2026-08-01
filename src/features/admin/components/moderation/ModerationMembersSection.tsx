import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminClubMembers, removeAdminClubMember } from "@/features/admin/api/moderation";
import { getErrorMessage } from "@/shared/api/client";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import IconButton from "@/shared/ui/IconButton";
import { CLUB_ROLE_ICONS, CLUB_ROLE_LABELS, MEMBERSHIP_STATUS_LABELS } from "@/features/clubs/labels";
import type { ClubMemberRow } from "@/shared/types";

/**
 * Tenant-üstü üye moderasyonu (`club.member.manage`) — kulübün KENDİ officer/
 * başkan katmanından bağımsız bir override. Bekleyen istekler de listelenir
 * (officer'ın join-request ekranıyla karışmasın diye burada salt "çıkar" var,
 * onay/red kulübün kendi akışıdır).
 */
interface ModerationMembersSectionProps {
  universityId: string;
  clubId: string;
  canManage: boolean;
}

export default function ModerationMembersSection({
  universityId,
  clubId,
  canManage,
}: ModerationMembersSectionProps) {
  const queryClient = useQueryClient();
  const [removeTarget, setRemoveTarget] = useState<ClubMemberRow | null>(null);

  const membersQuery = useQuery({
    queryKey: ["admin", universityId, "clubs", clubId, "members"],
    queryFn: () => getAdminClubMembers(universityId, clubId),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeAdminClubMember(universityId, clubId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", universityId, "clubs", clubId, "members"] });
      // Kulübün kendi üye sayısı/listesi de bu satırdan besleniyor olabilir.
      queryClient.invalidateQueries({ queryKey: ["clubs", clubId] });
      setRemoveTarget(null);
    },
  });

  const members = membersQuery.data ?? [];

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="icon-tile"><Icon name="members" size={24} className="text-brand-600" /></span>
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Üyeler</h2>
          <p className="text-xs text-slate-500">{members.length} kayıt (bekleyenler dahil)</p>
        </div>
      </div>

      {membersQuery.isLoading ? (
        <div className="space-y-3">
          <div className="skeleton h-14 w-full" />
          <div className="skeleton h-14 w-full" />
        </div>
      ) : membersQuery.isError ? (
        <div className="alert-error">{getErrorMessage(membersQuery.error, "Üyeler yüklenemedi.")}</div>
      ) : members.length === 0 ? (
        <EmptyState icon="members" title="Bu kulüpte üye yok" />
      ) : (
        <ul className="divide-y divide-slate-100">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-600 to-accent-400 text-xs font-bold text-white">
                  {m.user.photoUrl ? (
                    <img src={m.user.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (m.user.firstName[0] ?? "?").toUpperCase()
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {m.user.firstName} {m.user.lastName}
                  </p>
                  <p className="truncate text-xs text-slate-400">{m.user.email}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="chip gap-1.5">
                  <Icon name={CLUB_ROLE_ICONS[m.role]} size={13} className="text-brand-600" />
                  {CLUB_ROLE_LABELS[m.role]}
                </span>
                {m.status !== "approved" && (
                  <span className="rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                    {MEMBERSHIP_STATUS_LABELS[m.status]}
                  </span>
                )}
                {canManage && m.role !== "president" && (
                  <IconButton
                    icon="delete"
                    label="Üyeyi kulüpten çıkar"
                    tone="danger"
                    onClick={() => setRemoveTarget(m)}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        title={`${removeTarget?.user.firstName ?? ""} ${removeTarget?.user.lastName ?? ""} kulüpten çıkarılsın mı?`}
        description="Bu bir moderasyon işlemidir; üye tekrar katılmak isterse yeniden istek göndermesi gerekir."
        confirmLabel="Çıkar"
        loading={removeMutation.isPending}
        error={removeMutation.isError ? getErrorMessage(removeMutation.error, "Üye çıkarılamadı.") : null}
        onConfirm={() => removeTarget && removeMutation.mutate(removeTarget.userId)}
        onClose={() => {
          setRemoveTarget(null);
          removeMutation.reset();
        }}
      />
    </section>
  );
}
