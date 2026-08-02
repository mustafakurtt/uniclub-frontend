import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { listPlatformTenants } from "@/features/platform/api/tenants";
import TenantInvitationsSection from "@/features/platform/components/TenantInvitationsSection";
import TenantStatusDialog from "@/features/platform/components/TenantStatusDialog";
import { platformTenantsQueryKey } from "@/features/platform/queries";
import { tenantStatusActions } from "@/features/platform/tenantStatusActions";
import {
  TENANT_STATUS_CHIP,
  TENANT_STATUS_LABELS,
} from "@/features/platform/labels";
import RequirePermission from "@/features/auth/guards/RequirePermission";
import Forbidden from "@/features/auth/pages/Forbidden";
import { getErrorMessage } from "@/shared/api/client";
import PageLoader from "@/shared/ui/PageLoader";
import { Icon } from "@/shared/ui/Icon";
import type { TenantListItem, UniversityLifecycleStatus } from "@/shared/types";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PlatformTenantDetailPage() {
  const { universityId = "" } = useParams();
  const queryClient = useQueryClient();
  const [statusDialog, setStatusDialog] = useState<{
    tenant: TenantListItem;
    targetStatus: UniversityLifecycleStatus;
  } | null>(null);

  const tenantsQuery = useInfiniteQuery({
    queryKey: platformTenantsQueryKey,
    queryFn: ({ pageParam }) => listPlatformTenants({ limit: 100, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const tenant = useMemo(() => {
    const items = tenantsQuery.data?.pages.flatMap((p) => p.items) ?? [];
    return items.find((t) => t.id === universityId) ?? null;
  }, [tenantsQuery.data, universityId]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: platformTenantsQueryKey });

  if (tenantsQuery.isLoading) {
    return <PageLoader label="Tenant yükleniyor…" />;
  }

  if (tenantsQuery.isError) {
    return (
      <div className="alert-error">
        {getErrorMessage(tenantsQuery.error, "Tenant yüklenemedi.")}
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="card p-8 text-center">
        <p className="font-semibold text-slate-700">Tenant bulunamadı.</p>
        <Link to="/admin/platform/tenants" className="btn-primary mt-4 inline-flex">
          Listeye dön
        </Link>
      </div>
    );
  }

  const actions = tenantStatusActions(tenant.status);

  return (
    <RequirePermission permission="platform.tenant.view" fallback={<Forbidden />}>
      <div className="space-y-8">
        <div>
          <Link
            to="/admin/platform/tenants"
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-700"
          >
            <Icon name="arrowLeft" size={16} /> Tenantlar
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-extrabold text-slate-900">{tenant.name}</h1>
              <p className="mt-1 text-sm text-slate-500">{tenant.slug}</p>
              <span className={`chip mt-2 text-xs ${TENANT_STATUS_CHIP[tenant.status]}`}>
                {TENANT_STATUS_LABELS[tenant.status]}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <RequirePermission key={action.status} permission="platform.tenant.manage">
                  <button
                    type="button"
                    className={
                      action.destructive ? "btn-ghost text-sm text-red-600" : "btn-secondary text-sm"
                    }
                    onClick={() =>
                      setStatusDialog({ tenant, targetStatus: action.status })
                    }
                  >
                    {action.label}
                  </button>
                </RequirePermission>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Domain", value: tenant.domainCount },
            { label: "Kullanıcı", value: tenant.userCount },
            { label: "Kulüp", value: tenant.clubCount },
            { label: "Bekleyen başvuru", value: tenant.pendingApplications },
          ].map((stat) => (
            <div key={stat.label} className="card p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{stat.label}</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {(tenant.statusReason || tenant.statusChangedAt) && (
          <div className="card p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Son durum değişikliği</p>
            {tenant.statusReason && <p className="mt-1">{tenant.statusReason}</p>}
            <p className="mt-2 text-xs text-slate-400">{formatDateTime(tenant.statusChangedAt)}</p>
          </div>
        )}

        <RequirePermission permission="platform.tenant.invite">
          <TenantInvitationsSection universityId={tenant.id} />
        </RequirePermission>

        {statusDialog && (
          <TenantStatusDialog
            open
            tenant={statusDialog.tenant}
            targetStatus={statusDialog.targetStatus}
            onSaved={invalidate}
            onClose={() => setStatusDialog(null)}
          />
        )}
      </div>
    </RequirePermission>
  );
}
