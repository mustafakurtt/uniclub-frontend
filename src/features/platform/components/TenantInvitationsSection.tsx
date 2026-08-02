import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelTenantAdminInvitation,
  listTenantAdminInvitations,
} from "@/features/platform/api/tenants";
import InviteTenantAdminModal from "@/features/platform/components/InviteTenantAdminModal";
import { platformTenantInvitationsQueryKey } from "@/features/platform/queries";
import {
  INVITATION_STATUS_CHIP,
  INVITATION_STATUS_LABELS,
} from "@/features/platform/labels";
import { getErrorMessage } from "@/shared/api/client";
import RequirePermission from "@/features/auth/guards/RequirePermission";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import type { TenantAdminInvitation } from "@/shared/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  universityId: string;
}

export default function TenantInvitationsSection({ universityId }: Props) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const invitationsQuery = useQuery({
    queryKey: platformTenantInvitationsQueryKey(universityId),
    queryFn: () => listTenantAdminInvitations(universityId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: platformTenantInvitationsQueryKey(universityId),
    });

  const cancelMutation = useMutation({
    mutationFn: (invitationId: string) =>
      cancelTenantAdminInvitation(universityId, invitationId),
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: (err) => setActionError(getErrorMessage(err, "Davet iptal edilemedi.")),
  });

  const invitations = invitationsQuery.data ?? [];

  return (
    <section className="card p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Yönetici davetleri</h2>
          <p className="mt-1 text-xs text-slate-500">
            Bekleyen davetler — kabul, iptal veya süre dolması backend tarafından izlenir.
          </p>
        </div>
        <RequirePermission permission="platform.tenant.invite">
          <button type="button" className="btn-secondary text-sm" onClick={() => setCreateOpen(true)}>
            <Icon name="add" size={14} /> Davet gönder
          </button>
        </RequirePermission>
      </div>

      {actionError && <div className="alert-error mb-4 text-sm">{actionError}</div>}

      {invitationsQuery.isLoading ? (
        <div className="skeleton h-20 w-full" />
      ) : invitationsQuery.isError ? (
        <div className="alert-error text-sm">
          {getErrorMessage(invitationsQuery.error, "Davetler yüklenemedi.")}
        </div>
      ) : invitations.length === 0 ? (
        <EmptyState icon="email" title="Bekleyen davet yok" />
      ) : (
        <ul className="divide-y divide-slate-100">
          {invitations.map((inv: TenantAdminInvitation) => (
            <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-semibold text-slate-900">
                  {inv.firstName} {inv.lastName}
                </p>
                <p className="text-xs text-slate-500">{inv.email}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Son geçerlilik: {formatDate(inv.expiresAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`chip text-[10px] ${INVITATION_STATUS_CHIP[inv.status]}`}>
                  {INVITATION_STATUS_LABELS[inv.status]}
                </span>
                {inv.status === "pending" && (
                  <RequirePermission permission="platform.tenant.invite">
                    <button
                      type="button"
                      className="btn-ghost text-xs text-red-600"
                      disabled={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate(inv.id)}
                    >
                      İptal et
                    </button>
                  </RequirePermission>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <InviteTenantAdminModal
        open={createOpen}
        universityId={universityId}
        onSaved={invalidate}
        onClose={() => setCreateOpen(false)}
      />
    </section>
  );
}
