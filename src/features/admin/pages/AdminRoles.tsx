import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRoles,
  getPermissions,
  createRole,
  updateRole,
  deleteRole,
  addRolePermission,
  removeRolePermission,
} from "@/features/admin/api/rbac";
import { getErrorMessage } from "@/shared/api/client";
import { CORE_ROLE_NAMES } from "@/features/auth/authorization";
import { canAssignRole, roleOutrankedReason } from "@/features/admin/rank";
import { useRankActor } from "@/features/admin/useRankActor";
import PageLoader from "@/shared/ui/PageLoader";
import EmptyState from "@/shared/ui/EmptyState";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import { Icon } from "@/shared/ui/Icon";
import RoleFormModal, { type RoleFormValues } from "@/features/admin/components/RoleFormModal";
import { roleLabel, permissionLabel } from "@/features/admin/labels";
import type { RoleWithPermissions } from "@/shared/types";

// Roller (docs/FRONTEND_YONETIM.md §6.2) — `role.manage`. super_admin global +
// tüm tenant'lar; university_admin yalnızca kendi tenant rollerini yönetir
// (backend zorlar). Çekirdek roller silinemez/adları değişmez. Her rol kartında
// yetki demeti düzenlenir; değişiklik o role sahip herkesin cache'ini tazeler.

export default function AdminRoles() {
  const queryClient = useQueryClient();
  const actor = useRankActor();
  const [creating, setCreating] = useState(false);
  const [editTarget, setEditTarget] = useState<RoleWithPermissions | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleWithPermissions | null>(null);
  const [addPermFor, setAddPermFor] = useState<Record<string, string>>({});

  const rolesQuery = useQuery({ queryKey: ["rbac", "roles"], queryFn: getRoles });
  const permsQuery = useQuery({ queryKey: ["rbac", "permissions"], queryFn: getPermissions });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["rbac", "roles"] });

  const createMutation = useMutation({
    mutationFn: (values: RoleFormValues) =>
      createRole({
        name: values.name,
        description: values.description || undefined,
        rank: values.rank,
      }),
    onSuccess: () => {
      invalidate();
      setCreating(false);
    },
  });

  const editMutation = useMutation({
    mutationFn: (values: RoleFormValues) =>
      updateRole(editTarget!.id, {
        name: editTarget!.name,
        description: values.description || undefined,
        // Çekirdek rolün rütbesi değiştirilemez → alanı hiç gönderme (§3).
        rank: CORE_ROLE_NAMES.includes(editTarget!.name) ? undefined : values.rank,
      }),
    onSuccess: () => {
      invalidate();
      setEditTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRole(deleteTarget!.id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  const addPermMutation = useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      addRolePermission(roleId, permissionId),
    onSuccess: (_d, { roleId }) => {
      invalidate();
      setAddPermFor((prev) => ({ ...prev, [roleId]: "" }));
    },
  });

  const removePermMutation = useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      removeRolePermission(roleId, permissionId),
    onSuccess: invalidate,
  });

  const roles = rolesQuery.data ?? [];
  const permissions = permsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900">Roller</h1>
          <p className="mt-1 text-sm text-slate-500">
            Rol = yetki demeti. Değişiklik o role sahip herkese anında yansır.
          </p>
        </div>
        <button className="btn-primary shrink-0" onClick={() => setCreating(true)}>
          <Icon name="add" size={16} /> Yeni Rol
        </button>
      </div>

      {rolesQuery.isLoading ? (
        <PageLoader label="Roller yükleniyor..." />
      ) : rolesQuery.isError ? (
        <div className="alert-error">{getErrorMessage(rolesQuery.error, "Roller yüklenemedi.")}</div>
      ) : roles.length === 0 ? (
        <EmptyState icon="role" title="Henüz rol yok" />
      ) : (
        <div className="space-y-4">
          {roles.map((role) => {
            const isCore = CORE_ROLE_NAMES.includes(role.name);
            // Eşit/üst rütbeli rol üzerinde işlem yapılamaz (§3) — super_admin muaf.
            const manageable = canAssignRole(actor, role);
            const rolePermIds = new Set(role.permissions.map((p) => p.id));
            const remaining = permissions.filter((p) => !rolePermIds.has(p.id));
            const selected = addPermFor[role.id] ?? "";
            return (
              <section key={role.id} className="card p-5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="icon-tile"><Icon name="role" size={22} className="text-brand-600" /></span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-lg font-bold text-slate-900">
                          {roleLabel(role.name)}
                        </h2>
                        {isCore && <span className="badge">Sistem</span>}
                        <span className="chip">
                          {role.universityId ? "Tenant" : "Global"}
                        </span>
                        {/* Rütbe: yüksek olan daha yetkili (FRONTEND_RUTBE_VE_PLATFORM.md §3) */}
                        <span className="chip" title="Yetki derecesi (rütbe)">
                          #{role.rank}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-slate-400">{role.name}</p>
                      {role.description && (
                        <p className="mt-0.5 text-xs text-slate-500">{role.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      className="btn-ghost px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                      title={manageable ? undefined : roleOutrankedReason}
                      disabled={!manageable}
                      onClick={() => setEditTarget(role)}
                    >
                      <Icon name="edit" size={14} /> Düzenle
                    </button>
                    {!isCore && (
                      <button
                        className="btn-ghost px-3 py-1.5 text-xs text-slate-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        title={manageable ? undefined : roleOutrankedReason}
                        disabled={!manageable}
                        onClick={() => setDeleteTarget(role)}
                      >
                        <Icon name="delete" size={14} /> Sil
                      </button>
                    )}
                  </div>
                </div>

                {/* Yetki demeti */}
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.length === 0 && (
                    <span className="text-xs text-slate-400">Yetki yok.</span>
                  )}
                  {role.permissions.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600"
                      title={permissionLabel(p.key)}
                    >
                      <span className="font-mono">{p.key}</span>
                      <button
                        className="text-slate-400 hover:text-red-600"
                        aria-label={`${p.key} yetkisini kaldır`}
                        disabled={removePermMutation.isPending}
                        onClick={() =>
                          removePermMutation.mutate({ roleId: role.id, permissionId: p.id })
                        }
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Yetki ekle */}
                {remaining.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                      className="select-field w-auto text-sm"
                      value={selected}
                      onChange={(e) =>
                        setAddPermFor((prev) => ({ ...prev, [role.id]: e.target.value }))
                      }
                      aria-label="Yetki ekle"
                    >
                      <option value="">Yetki ekle…</option>
                      {remaining.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.key}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn-secondary px-3 py-1.5 text-xs"
                      disabled={!selected || addPermMutation.isPending}
                      onClick={() =>
                        selected &&
                        addPermMutation.mutate({ roleId: role.id, permissionId: selected })
                      }
                    >
                      <Icon name="add" size={14} /> Ekle
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {(addPermMutation.isError || removePermMutation.isError) && (
        <div className="alert-error">
          {getErrorMessage(
            addPermMutation.error ?? removePermMutation.error,
            "Yetki güncellenemedi."
          )}
        </div>
      )}

      <RoleFormModal
        open={creating}
        title="Yeni Rol"
        submitLabel="Oluştur"
        error={createMutation.isError ? getErrorMessage(createMutation.error, "Rol oluşturulamadı.") : null}
        onSubmit={(values) => createMutation.mutateAsync(values)}
        onClose={() => {
          setCreating(false);
          createMutation.reset();
        }}
      />

      <RoleFormModal
        open={!!editTarget}
        title={`Rolü Düzenle — ${editTarget ? roleLabel(editTarget.name) : ""}`}
        lockName
        lockRank={!!editTarget && CORE_ROLE_NAMES.includes(editTarget.name)}
        defaultValues={{
          name: editTarget?.name,
          description: editTarget?.description ?? "",
          rank: editTarget?.rank ?? 0,
        }}
        error={editMutation.isError ? getErrorMessage(editMutation.error, "Güncellenemedi.") : null}
        onSubmit={(values) => editMutation.mutateAsync(values)}
        onClose={() => {
          setEditTarget(null);
          editMutation.reset();
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`"${deleteTarget ? roleLabel(deleteTarget.name) : ""}" rolü silinsin mi?`}
        description="Role bağlı yetki ve kullanıcı atamaları temizlenir. Bu işlem geri alınamaz."
        confirmLabel="Sil"
        loading={deleteMutation.isPending}
        error={deleteMutation.isError ? getErrorMessage(deleteMutation.error, "Silinemedi.") : null}
        onConfirm={() => deleteMutation.mutate()}
        onClose={() => {
          setDeleteTarget(null);
          deleteMutation.reset();
        }}
      />
    </div>
  );
}
