// Global rol atama — `role.manage` + rütbe hiyerarşisi
// (FRONTEND_RUTBE_VE_PLATFORM.md §3/§4). Kurallar:
//   • kendi rolünü SÖKME hiçbir koşulda mümkün değil (super_admin dahil),
//   • kendine rol EKLEME serbest (rütbe kuralı yükseltmeyi zaten kapatır),
//   • eşit/üst rütbeli rol atanamaz-sökülemez,
//   • platform rolleri (super_admin/platform_support) yalnızca super_admin'de.
// Hepsi backend'de de zorunlu; buradaki disable yalnızca 400'e çarpmayı önler.
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  assignUserRole,
  demoteSuperAdmin,
  getRoles,
  promoteToSuperAdmin,
  removeUserRole,
} from "@/features/admin/api/rbac";
import { roleLabel } from "@/features/admin/labels";
import {
  canAssignRole,
  canRemoveRoleFrom,
  outrankedReason,
  roleOutrankedReason,
  selfActionReason,
} from "@/features/admin/rank";
import { useRankActor } from "@/features/admin/useRankActor";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Icon } from "@/shared/ui/Icon";
import type { AdminUserDetail } from "@/shared/types";
import MutationError from "./MutationError";
import { useInvalidateUserDetail } from "./useUserDetail";

interface Props {
  universityId: string;
  user: AdminUserDetail;
}

export default function GlobalRolesSection({ universityId, user }: Props) {
  const { hasPermission, isSuperAdmin } = useAuth();
  const actor = useRankActor();
  const invalidate = useInvalidateUserDetail(universityId, user.id);
  const canManageRoles = hasPermission("role.manage");
  const [addRoleId, setAddRoleId] = useState("");

  const rolesCatalogQuery = useQuery({
    queryKey: ["rbac", "roles"],
    queryFn: getRoles,
    enabled: canManageRoles,
  });

  const assignRoleMutation = useMutation({
    mutationFn: (roleId: string) => assignUserRole(user.id, roleId),
    onSuccess: () => {
      invalidate();
      setAddRoleId("");
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: (roleId: string) => removeUserRole(user.id, roleId),
    onSuccess: invalidate,
  });

  const superAdminMutation = useMutation({
    mutationFn: (grant: boolean) =>
      grant ? promoteToSuperAdmin(user.id) : demoteSuperAdmin(user.id),
    onSuccess: invalidate,
  });

  const ownedRoleIds = new Set(user.roles.map((r) => r.id));
  // Katalogdan yalnızca rütbe/platform kurallarına uyanları göster — atanamayacak
  // rolü listelemek kullanıcıyı boşuna 400'e sürükler.
  const assignableRoles = (rolesCatalogQuery.data ?? []).filter(
    (r) => !ownedRoleIds.has(r.id) && canAssignRole(actor, r)
  );
  const isTargetSuperAdmin = user.roles.some((r) => r.name === "super_admin");

  const isSelf = user.id === actor.userId;
  // Sökme: kendinden sökmek her koşulda yasak; ayrıca hedef rütbesi aktörünkinden
  // düşük olmalı. Rolün KENDİ rütbesi de aktörünkinden düşük olmalı.
  const removalBlockedReason = isSelf
    ? selfActionReason
    : !canRemoveRoleFrom(actor, user)
      ? outrankedReason
      : null;

  return (
    <section>
      <MutationError
        error={assignRoleMutation.error ?? removeRoleMutation.error ?? superAdminMutation.error}
      />
      <h3 className="input-label">Global Roller</h3>
      <div className="flex flex-wrap gap-1.5">
        {user.roles.length === 0 && <span className="text-xs text-slate-400">Rol atanmamış.</span>}
        {user.roles.map((r) => {
          // Rolü sökebilmek için HEM hedef kullanıcı HEM de rolün kendisi
          // aktörün rütbesinin altında olmalı.
          const blocked = removalBlockedReason ?? (!canAssignRole(actor, r) ? roleOutrankedReason : null);
          return (
            <span
              key={r.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700"
              title={`Rütbe ${r.rank}`}
            >
              {roleLabel(r.name)}
              {canManageRoles && (
                <button
                  className="text-brand-400 hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:text-slate-300"
                  aria-label={`${roleLabel(r.name)} rolünü kaldır`}
                  title={blocked ?? undefined}
                  disabled={!!blocked || removeRoleMutation.isPending}
                  onClick={() => removeRoleMutation.mutate(r.id)}
                >
                  <Icon name="close" size={13} />
                </button>
              )}
            </span>
          );
        })}
      </div>

      {canManageRoles && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            className="select-field w-auto text-sm"
            value={addRoleId}
            onChange={(e) => setAddRoleId(e.target.value)}
            aria-label="Rol ekle"
            disabled={assignableRoles.length === 0}
          >
            <option value="">
              {assignableRoles.length === 0 ? "Atayabileceğin rol yok" : "Rol ekle…"}
            </option>
            {assignableRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {roleLabel(r.name)} · #{r.rank}
              </option>
            ))}
          </select>
          <button
            className="btn-secondary px-3 py-1.5 text-xs"
            disabled={!addRoleId || assignRoleMutation.isPending}
            onClick={() => addRoleId && assignRoleMutation.mutate(addRoleId)}
          >
            <Icon name="add" size={14} /> Ata
          </button>
        </div>
      )}

      {/* super_admin promote/demote — yalnızca super_admin aktör (§6.1).
          Kendi süper yöneticiliğini geri alma yasaktır (rol sökme kuralı). */}
      {canManageRoles && isSuperAdmin && (
        <div className="mt-3">
          {isTargetSuperAdmin ? (
            <button
              className="btn-ghost px-3 py-1.5 text-xs text-slate-400 hover:text-red-600 disabled:cursor-not-allowed"
              title={isSelf ? selfActionReason : undefined}
              disabled={isSelf || superAdminMutation.isPending}
              onClick={() => superAdminMutation.mutate(false)}
            >
              <Icon name="president" size={14} /> Süper Yöneticiliği Geri Al
            </button>
          ) : (
            <button
              className="btn-ghost px-3 py-1.5 text-xs"
              disabled={superAdminMutation.isPending}
              onClick={() => superAdminMutation.mutate(true)}
            >
              <Icon name="president" size={14} /> Süper Yönetici Yap
            </button>
          )}
        </div>
      )}
    </section>
  );
}
