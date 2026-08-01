import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cancelClubAdvisorInvitation,
  getClubAdvisorInvitations,
  getClubAdvisors,
} from "@/features/admin/api/advisors";
import { invitationDaysRemainingLabel } from "@/features/clubs/advisorInvitationLabels";
import { getErrorMessage } from "@/shared/api/client";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";

interface Props {
  universityId: string;
  clubId: string;
  enabled: boolean;
  advisorVacant: boolean;
  canManage: boolean;
  onInvite?: () => void;
}

export default function AdvisorsTab({
  universityId,
  clubId,
  enabled,
  advisorVacant,
  canManage,
  onInvite,
}: Props) {
  const queryClient = useQueryClient();

  const advisorsQuery = useQuery({
    queryKey: ["admin", universityId, "clubs", clubId, "advisors"],
    queryFn: () => getClubAdvisors(universityId, clubId),
    enabled,
  });

  const invitationsQuery = useQuery({
    queryKey: ["admin", universityId, "clubs", clubId, "advisor-invitations"],
    queryFn: () => getClubAdvisorInvitations(universityId, clubId),
    enabled: enabled && canManage,
  });

  const cancelMutation = useMutation({
    mutationFn: (invitationId: string) =>
      cancelClubAdvisorInvitation(universityId, clubId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", universityId, "clubs", clubId, "advisor-invitations"],
      });
      queryClient.invalidateQueries({ queryKey: ["admin", universityId, "club", clubId] });
    },
  });

  const advisors = advisorsQuery.data ?? [];
  const invitations = invitationsQuery.data ?? [];
  const isLoading = advisorsQuery.isLoading || (canManage && invitationsQuery.isLoading);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-14 w-full" />
      </div>
    );
  }

  if (advisorsQuery.isError) {
    return (
      <div className="alert-error">
        {getErrorMessage(advisorsQuery.error, "Danışmanlar yüklenemedi.")}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {advisorVacant && (
        <div className="alert-error flex items-start gap-3 text-sm">
          <Icon name="advisor" size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Bu kulübün aktif danışmanı yok</p>
            <p className="mt-0.5 text-slate-600">
              Kurumsal süreçler için danışman atanması gerekir. Bekleyen davet kabul edilene kadar
              kulüp danışmansız sayılır.
            </p>
          </div>
        </div>
      )}

      {canManage && onInvite && (
        <button type="button" className="btn-primary text-sm" onClick={onInvite}>
          <Icon name="add" size={14} /> Danışman davet et
        </button>
      )}

      <section>
        <h3 className="mb-2 text-sm font-bold text-slate-900">Aktif danışmanlar</h3>
        {advisors.length === 0 ? (
          <EmptyState icon="advisor" title="Aktif danışman yok" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {advisors.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-600 to-accent-400 text-xs font-bold text-white">
                  {a.photoUrl ? (
                    <img src={a.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (a.firstName[0] ?? "?").toUpperCase()
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {a.firstName} {a.lastName}
                  </p>
                  <p className="truncate text-xs text-slate-400">{a.email}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canManage && (
        <section>
          <h3 className="mb-2 text-sm font-bold text-slate-900">Bekleyen davetler</h3>
          {invitationsQuery.isError && (
            <div className="alert-error mb-3 text-sm">
              {getErrorMessage(invitationsQuery.error, "Davetler yüklenemedi.")}
            </div>
          )}
          {invitations.length === 0 ? (
            <p className="text-sm text-slate-500">Bekleyen davet yok.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {invitations.map((inv) => (
                <li key={inv.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      {inv.invitee
                        ? `${inv.invitee.firstName} ${inv.invitee.lastName}`
                        : "Davetli"}
                    </p>
                    <p className="text-xs text-slate-400">{inv.invitee?.email}</p>
                    {inv.inviter && (
                      <p className="mt-1 text-xs text-slate-500">
                        Davet eden: {inv.inviter.firstName} {inv.inviter.lastName}
                      </p>
                    )}
                    {inv.message && (
                      <p className="mt-1 text-xs italic text-slate-500">"{inv.message}"</p>
                    )}
                    <p className="mt-1 text-[11px] font-semibold text-amber-700">
                      {invitationDaysRemainingLabel(inv.expiresAt)}
                    </p>
                  </div>
                  {inv.status === "pending" && (
                    <button
                      type="button"
                      className="btn-ghost shrink-0 text-xs text-red-600"
                      disabled={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate(inv.id)}
                    >
                      İptal
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {cancelMutation.isError && (
            <div className="alert-error mt-3 text-sm">
              {getErrorMessage(cancelMutation.error, "Davet iptal edilemedi.")}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
