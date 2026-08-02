import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listPlatformUsers } from "@/features/platform/api/operatorUsers";
import PlatformUserFormModal from "@/features/platform/components/PlatformUserFormModal";
import { platformUsersQueryKey } from "@/features/platform/queries";
import { PLATFORM_ROLE_LABELS } from "@/features/platform/labels";
import { roleLabel } from "@/features/admin/labels";
import RequirePermission from "@/features/auth/guards/RequirePermission";
import Forbidden from "@/features/auth/pages/Forbidden";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getErrorMessage } from "@/shared/api/client";
import PageLoader from "@/shared/ui/PageLoader";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import type { PlatformAccountRoleName } from "@/shared/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PlatformUsersPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const canCreate = hasPermission("platform.user.manage");

  const usersQuery = useQuery({
    queryKey: platformUsersQueryKey,
    queryFn: listPlatformUsers,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: platformUsersQueryKey });

  return (
    <RequirePermission permission="platform.user.view" fallback={<Forbidden />}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-slate-900">
              Platform operatörleri
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Tenant'sız SaaS hesapları — üniversite sütunu her zaman platform genelidir.
            </p>
          </div>
          {canCreate && (
            <button type="button" className="btn-primary text-sm" onClick={() => setCreateOpen(true)}>
              <Icon name="add" size={14} /> Yeni operatör
            </button>
          )}
        </div>

        {usersQuery.isLoading ? (
          <PageLoader label="Hesaplar yükleniyor…" />
        ) : usersQuery.isError ? (
          <div className="alert-error">
            {getErrorMessage(usersQuery.error, "Liste yüklenemedi.")}
          </div>
        ) : (usersQuery.data ?? []).length === 0 ? (
          <EmptyState icon="members" title="Platform hesabı yok" />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Ad</th>
                    <th className="px-4 py-3">E-posta</th>
                    <th className="px-4 py-3">Üniversite</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3">Kayıt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(usersQuery.data ?? []).map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{user.email}</td>
                      <td className="px-4 py-3 text-slate-500">Platform geneli</td>
                      <td className="px-4 py-3">
                        {user.roles.map((r) => (
                          <span key={r} className="chip text-[10px]">
                            {PLATFORM_ROLE_LABELS[r as PlatformAccountRoleName] ?? roleLabel(r)}
                          </span>
                        ))}
                      </td>
                      <td className="px-4 py-3 capitalize">{user.status}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <PlatformUserFormModal
          open={createOpen}
          onSaved={invalidate}
          onClose={() => setCreateOpen(false)}
        />
      </div>
    </RequirePermission>
  );
}
