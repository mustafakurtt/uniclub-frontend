import { useState } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { listPlatformTenants } from "@/features/platform/api/tenants";
import TenantOnboardModal from "@/features/platform/components/TenantOnboardModal";
import { platformTenantsQueryKey } from "@/features/platform/queries";
import {
  TENANT_STATUS_CHIP,
  TENANT_STATUS_LABELS,
} from "@/features/platform/labels";
import RequirePermission from "@/features/auth/guards/RequirePermission";
import Forbidden from "@/features/auth/pages/Forbidden";
import { getErrorMessage } from "@/shared/api/client";
import PageLoader from "@/shared/ui/PageLoader";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PlatformTenantsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [onboardOpen, setOnboardOpen] = useState(false);

  const tenantsQuery = useInfiniteQuery({
    queryKey: [...platformTenantsQueryKey, search],
    queryFn: ({ pageParam }) =>
      listPlatformTenants({
        limit: 50,
        cursor: pageParam,
        search: search || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: platformTenantsQueryKey });

  const items = tenantsQuery.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <RequirePermission permission="platform.tenant.view" fallback={<Forbidden />}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-slate-900">Tenantlar</h1>
            <p className="mt-1 text-sm text-slate-500">
              Üniversite kiracıları — durum, özet istatistikler ve yaşam döngüsü yönetimi.
            </p>
          </div>
          <RequirePermission permission="university.create">
            <button type="button" className="btn-primary text-sm" onClick={() => setOnboardOpen(true)}>
              <Icon name="add" size={14} /> Yeni tenant
            </button>
          </RequirePermission>
        </div>

        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
          }}
        >
          <input
            className="input-field max-w-md flex-1"
            placeholder="Ad veya slug ile ara…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn-secondary">
            Ara
          </button>
          {search && (
            <button
              type="button"
              className="btn-ghost text-sm"
              onClick={() => {
                setSearch("");
                setSearchInput("");
              }}
            >
              Temizle
            </button>
          )}
        </form>

        {tenantsQuery.isLoading ? (
          <PageLoader label="Tenantlar yükleniyor…" />
        ) : tenantsQuery.isError ? (
          <div className="alert-error">
            {getErrorMessage(tenantsQuery.error, "Liste yüklenemedi.")}
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon="university" title="Tenant bulunamadı" />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Üniversite</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3">Domain</th>
                    <th className="px-4 py-3">Kullanıcı</th>
                    <th className="px-4 py-3">Kulüp</th>
                    <th className="px-4 py-3">Bekleyen başvuru</th>
                    <th className="px-4 py-3">Oluşturulma</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{tenant.name}</p>
                        <p className="text-xs text-slate-400">{tenant.slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`chip text-[10px] ${TENANT_STATUS_CHIP[tenant.status]}`}>
                          {TENANT_STATUS_LABELS[tenant.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{tenant.domainCount}</td>
                      <td className="px-4 py-3 tabular-nums">{tenant.userCount}</td>
                      <td className="px-4 py-3 tabular-nums">{tenant.clubCount}</td>
                      <td className="px-4 py-3 tabular-nums">{tenant.pendingApplications}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDate(tenant.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/admin/platform/tenants/${tenant.id}`}
                          className="text-sm font-semibold text-brand-700 hover:text-brand-800"
                        >
                          Detay
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tenantsQuery.hasNextPage && (
          <button
            type="button"
            className="btn-secondary"
            disabled={tenantsQuery.isFetchingNextPage}
            onClick={() => tenantsQuery.fetchNextPage()}
          >
            {tenantsQuery.isFetchingNextPage ? "Yükleniyor…" : "Daha fazla göster"}
          </button>
        )}

        <TenantOnboardModal
          open={onboardOpen}
          onSaved={invalidate}
          onClose={() => setOnboardOpen(false)}
        />
      </div>
    </RequirePermission>
  );
}
