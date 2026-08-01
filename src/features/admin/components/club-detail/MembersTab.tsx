import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminClubMembers, removeAdminClubMember } from "@/features/admin/api/moderation";
import { getErrorMessage } from "@/shared/api/client";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import EmptyState from "@/shared/ui/EmptyState";
import IconButton from "@/shared/ui/IconButton";
import { CLUB_ROLE_ICONS, CLUB_ROLE_LABELS, MEMBERSHIP_STATUS_LABELS } from "@/features/clubs/labels";
import { Icon } from "@/shared/ui/Icon";
import type { ClubMemberRow } from "@/shared/types";

interface Props {
  universityId: string;
  clubId: string;
  canManage: boolean;
  enabled: boolean;
}

export default function MembersTab({ universityId, clubId, canManage, enabled }: Props) {
  const queryClient = useQueryClient();
  const [removeTarget, setRemoveTarget] = useState<ClubMemberRow | null>(null);

  const membersQuery = useQuery({
    queryKey: ["admin", universityId, "clubs", clubId, "members"],
    queryFn: () => getAdminClubMembers(universityId, clubId),
    enabled,
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeAdminClubMember(universityId, clubId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", universityId, "clubs", clubId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["admin", universityId, "club", clubId] });
      setRemoveTarget(null);
    },
  });

  const members = membersQuery.data ?? [];

  if (membersQuery.isLoading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-14 w-full" />
      </div>
    );
  }

  if (membersQuery.isError) {
    return (
      <div className="alert-error">{getErrorMessage(membersQuery.error, "Üyeler yüklenemedi.")}</div>
    );
  }

  if (members.length === 0) {
    return <EmptyState icon="members" title="Bu kulüpte üye yok" />;
  }

  return (
    <>
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
                <p className="truncate text-sm font-bold text-slate-900">
                  {m.user.firstName} {m.user.lastName}
                </p>
                <p className="truncate text-xs text-slate-400">{m.user.email}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="chip">
                <Icon name={CLUB_ROLE_ICONS[m.role]} size={12} /> {CLUB_ROLE_LABELS[m.role]}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {MEMBERSHIP_STATUS_LABELS[m.status]}
              </span>
              {canManage && m.status === "approved" && (
                <IconButton
                  icon="delete"
                  label="Üyeyi çıkar"
                  tone="danger"
                  onClick={() => setRemoveTarget(m)}
                />
              )}
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={!!removeTarget}
        title={`${removeTarget?.user.firstName} ${removeTarget?.user.lastName} kulüpten çıkarılsın mı?`}
        description="Bu bir tenant moderasyon işlemidir."
        confirmLabel="Çıkar"
        loading={removeMutation.isPending}
        error={removeMutation.isError ? getErrorMessage(removeMutation.error, "Çıkarılamadı.") : null}
        onConfirm={() => removeTarget && removeMutation.mutate(removeTarget.userId)}
        onClose={() => {
          setRemoveTarget(null);
          removeMutation.reset();
        }}
      />
    </>
  );
}
