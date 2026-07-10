import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changeClubMemberRole, removeClubMember, transferPresidency } from "@/features/clubs/api/clubs";
import { getErrorMessage } from "@/shared/api/client";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import IconButton from "@/shared/ui/IconButton";
import { CLUB_ROLE_ICONS, CLUB_ROLE_LABELS } from "@/features/clubs/labels";
import type { ClubMemberRow, ClubRole } from "@/shared/types";

// Üye listesi + kulüp-içi yönetim (FRONTEND_CLUBS.md §7).
// Yetki matrisi UI'da yalnızca UX içindir; gerçek kontrol backend'dedir:
//  • officer/başkan → üye çıkarma (başkan çıkarılamaz)
//  • yalnızca başkan → member↔officer geçişi ve başkanlık DEVRİ (ayrı akış, §7.5)

interface ClubMembersSectionProps {
  clubId: string;
  members: ClubMemberRow[];
  /** Oturum sahibinin bu kulüpteki onaylı rolü (danışmanlık burada sayılmaz) */
  myRole: ClubRole | null;
  myUserId: string | undefined;
}

type PendingAction =
  | { kind: "remove"; member: ClubMemberRow }
  | { kind: "transfer"; member: ClubMemberRow }
  | null;

export default function ClubMembersSection({
  clubId,
  members,
  myRole,
  myUserId,
}: ClubMembersSectionProps) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<PendingAction>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  const isOfficer = myRole === "officer" || myRole === "president";
  const isPresident = myRole === "president";

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["clubs", clubId] });
    // Kendi rolüm/üyeliğim de değişmiş olabilir (devir, çıkarma)
    queryClient.invalidateQueries({ queryKey: ["auth", "clubMemberships"] });
  };

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeClubMember(clubId, userId),
    onSuccess: () => {
      invalidate();
      setAction(null);
    },
  });

  const transferMutation = useMutation({
    mutationFn: (userId: string) => transferPresidency(clubId, userId),
    onSuccess: () => {
      invalidate();
      setAction(null);
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "member" | "officer" }) =>
      changeClubMemberRole(clubId, userId, role),
    onSuccess: invalidate,
    onError: (error) => setRoleError(getErrorMessage(error, "Rol güncellenemedi.")),
  });

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="icon-tile"><Icon name="members" size={24} className="text-brand-600" /></span>
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Üyeler</h2>
          <p className="text-xs text-slate-500">{members.length} onaylı üye</p>
        </div>
      </div>

      {roleError && (
        <div className="alert-error mb-4 flex items-center justify-between gap-3">
          <span>{roleError}</span>
          <IconButton icon="close" label="Kapat" tone="danger" onClick={() => setRoleError(null)} />
        </div>
      )}

      {members.length === 0 ? (
        <EmptyState icon="members" title="Henüz üye yok" />
      ) : (
        <ul className="divide-y divide-slate-100">
          {members.map((m) => {
            const isSelf = m.userId === myUserId;
            const isTargetPresident = m.role === "president";
            return (
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
                      {isSelf && <span className="ml-1 text-xs font-normal text-slate-400">(sen)</span>}
                    </p>
                    <span className="chip mt-0.5 gap-1.5">
                      <Icon name={CLUB_ROLE_ICONS[m.role]} size={13} className="text-brand-600" />
                      {CLUB_ROLE_LABELS[m.role]}
                    </span>
                  </div>
                </div>

                {isOfficer && !isSelf && !isTargetPresident && (
                  <div className="flex shrink-0 items-center gap-1">
                    {isPresident && (
                      <>
                        <button
                          className="btn-ghost px-3 py-1.5 text-xs"
                          disabled={roleMutation.isPending}
                          onClick={() =>
                            roleMutation.mutate({
                              userId: m.userId,
                              role: m.role === "officer" ? "member" : "officer",
                            })
                          }
                        >
                          {m.role === "officer" ? "Üyeliğe Düşür" : "Yönetici Yap"}
                        </button>
                        <button
                          className="btn-ghost px-3 py-1.5 text-xs"
                          onClick={() => setAction({ kind: "transfer", member: m })}
                        >
                          <Icon name="president" size={14} /> Devret
                        </button>
                      </>
                    )}
                    <IconButton
                      icon="delete"
                      label="Üyeyi çıkar"
                      tone="danger"
                      onClick={() => setAction({ kind: "remove", member: m })}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={action?.kind === "remove"}
        title={`${action?.member.user.firstName ?? ""} kulüpten çıkarılsın mı?`}
        description="Üye tekrar katılmak isterse yeniden istek göndermesi gerekir."
        confirmLabel="Çıkar"
        loading={removeMutation.isPending}
        error={removeMutation.isError ? getErrorMessage(removeMutation.error, "Üye çıkarılamadı.") : null}
        onConfirm={() => action && removeMutation.mutate(action.member.userId)}
        onClose={() => {
          setAction(null);
          removeMutation.reset();
        }}
      />

      <ConfirmDialog
        open={action?.kind === "transfer"}
        title={`Başkanlık ${action?.member.user.firstName ?? ""}'a devredilsin mi?`}
        description="Devirden sonra sen officer olursun; bu işlem yalnızca yeni başkan tarafından geri devredilebilir."
        confirmLabel="Başkanlığı Devret"
        tone="primary"
        loading={transferMutation.isPending}
        error={
          transferMutation.isError
            ? getErrorMessage(transferMutation.error, "Başkanlık devredilemedi.")
            : null
        }
        onConfirm={() => action && transferMutation.mutate(action.member.userId)}
        onClose={() => {
          setAction(null);
          transferMutation.reset();
        }}
      />
    </section>
  );
}
