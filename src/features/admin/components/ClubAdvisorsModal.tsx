import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "@/shared/ui/Modal";
import EmptyState from "@/shared/ui/EmptyState";
import {
  cancelClubAdvisorInvitation,
  getAdminUsers,
  getClubAdvisorInvitations,
  getClubAdvisors,
  inviteClubAdvisor,
  removeClubAdvisor,
} from "@/features/admin/api";
import { invitationDaysRemainingLabel } from "@/features/clubs/advisorInvitationLabels";
import { getErrorMessage } from "@/shared/api/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Icon } from "@/shared/ui/Icon";
import type { Club } from "@/shared/types";

interface ClubAdvisorsModalProps {
  open: boolean;
  universityId: string;
  club: Club | null;
  onClose: () => void;
}

export default function ClubAdvisorsModal({ open, universityId, club, onClose }: ClubAdvisorsModalProps) {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const canSearchUsers = hasPermission("user.view");
  const clubId = club?.id ?? "";

  const advisorsQuery = useQuery({
    queryKey: ["admin", universityId, "clubs", clubId, "advisors"],
    queryFn: () => getClubAdvisors(universityId, clubId),
    enabled: open && !!clubId,
  });

  const invitationsQuery = useQuery({
    queryKey: ["admin", universityId, "clubs", clubId, "advisor-invitations"],
    queryFn: () => getClubAdvisorInvitations(universityId, clubId),
    enabled: open && !!clubId,
  });

  const candidatesQuery = useQuery({
    queryKey: ["admin", universityId, "users", { role: "advisor" }],
    queryFn: () => getAdminUsers(universityId, { role: "advisor" }),
    enabled: open && canSearchUsers,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", universityId, "clubs", clubId, "advisors"] });
    queryClient.invalidateQueries({
      queryKey: ["admin", universityId, "clubs", clubId, "advisor-invitations"],
    });
    queryClient.invalidateQueries({ queryKey: ["admin", universityId, "club", clubId] });
  };

  const inviteMutation = useMutation({
    mutationFn: (payload: { userId: string; message?: string }) =>
      inviteClubAdvisor(universityId, clubId, payload),
    onSuccess: () => {
      invalidate();
      setSearch("");
      setMessage("");
      setSelectedUserId(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (invitationId: string) =>
      cancelClubAdvisorInvitation(universityId, clubId, invitationId),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeClubAdvisor(universityId, clubId, userId),
    onSuccess: invalidate,
  });

  const advisors = advisorsQuery.data ?? [];
  const invitations = invitationsQuery.data ?? [];
  const advisorIds = new Set(advisors.map((a) => a.id));
  const pendingInviteeIds = new Set(
    invitations.filter((i) => i.status === "pending").map((i) => i.invitee?.id).filter(Boolean)
  );
  const query = search.trim().toLocaleLowerCase("tr-TR");
  const candidates = (candidatesQuery.data ?? [])
    .filter((u) => !advisorIds.has(u.id) && !pendingInviteeIds.has(u.id))
    .filter((u) =>
      query.length < 2
        ? false
        : `${u.firstName} ${u.lastName} ${u.email}`.toLocaleLowerCase("tr-TR").includes(query)
    );

  const actionError =
    inviteMutation.error ?? cancelMutation.error ?? removeMutation.error ?? null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Danışmanlar — ${club?.name ?? ""}`}
      description="Danışman ataması davet ile yapılır; akademisyen kabul edene kadar kulüpte danışman sayılmaz."
      size="md"
      footer={
        <button type="button" className="btn-ghost" onClick={onClose}>
          Kapat
        </button>
      }
    >
      {actionError && (
        <div className="alert-error mb-4">{getErrorMessage(actionError, "İşlem gerçekleştirilemedi.")}</div>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Aktif danışmanlar</h3>
        {advisorsQuery.isLoading ? (
          <div className="skeleton h-12 w-full" />
        ) : advisors.length === 0 ? (
          <EmptyState icon="advisor" title="Aktif danışman yok" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {advisors.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {a.firstName} {a.lastName}
                  </p>
                  <p className="truncate text-xs text-slate-400">{a.email}</p>
                </div>
                <button
                  type="button"
                  className="btn-ghost shrink-0 px-3 py-1.5 text-xs text-slate-400 hover:text-red-600"
                  disabled={removeMutation.isPending}
                  onClick={() => removeMutation.mutate(a.id)}
                >
                  Kaldır
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Bekleyen davetler</h3>
        {invitationsQuery.isLoading ? (
          <div className="skeleton h-12 w-full" />
        ) : invitations.length === 0 ? (
          <p className="text-sm text-slate-500">Bekleyen davet yok.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {inv.invitee
                      ? `${inv.invitee.firstName} ${inv.invitee.lastName}`
                      : "Davetli"}
                  </p>
                  <p className="text-xs text-slate-400">{inv.invitee?.email}</p>
                  {inv.message && (
                    <p className="mt-1 text-xs text-slate-500 italic">"{inv.message}"</p>
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
      </section>

      {canSearchUsers && (
        <section className="mt-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Danışman davet et</h3>
          <input
            className="input-field"
            placeholder="Ad ya da e-posta ile ara (en az 2 karakter)…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedUserId(null);
            }}
          />
          {candidatesQuery.isLoading && <div className="skeleton h-10 w-full" />}
          {candidates.length > 0 && (
            <ul className="max-h-40 divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-100">
              {candidates.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left ${
                      selectedUserId === u.id ? "bg-brand-50" : "hover:bg-slate-50"
                    }`}
                    onClick={() => setSelectedUserId(u.id)}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="truncate text-xs text-slate-400">{u.email}</p>
                    </div>
                    {selectedUserId === u.id && <Icon name="check" size={14} className="text-brand-600" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selectedUserId && (
            <div className="space-y-2">
              <label className="input-label" htmlFor="invite-message">
                Davet mesajı (isteğe bağlı)
              </label>
              <textarea
                id="invite-message"
                rows={3}
                className="input-field min-h-[5rem] resize-y"
                placeholder="Kulübün amacı ve beklentileriniz…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary text-sm"
                disabled={inviteMutation.isPending}
                onClick={() =>
                  inviteMutation.mutate({
                    userId: selectedUserId,
                    ...(message.trim() ? { message: message.trim() } : {}),
                  })
                }
              >
                {inviteMutation.isPending ? "Gönderiliyor…" : "Davet gönder"}
              </button>
            </div>
          )}
        </section>
      )}
    </Modal>
  );
}
