import RequireUniversity from "@/features/admin/components/RequireUniversity";
import TenantSettingsPanel from "@/features/admin/components/tenant-settings/TenantSettingsPanel";
import RequirePermission from "@/features/auth/guards/RequirePermission";
import Forbidden from "@/features/auth/pages/Forbidden";

// Tenant politika ayarları — metadata-driven form (FRONTEND_TENANT_SETTINGS.md)
export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Tenant Ayarları</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kulüp sabitleme kotası, duyuru hızı ve başvuru onay zinciri gibi politika tuşları.
        </p>
      </div>

      <RequirePermission permission="university.settings.manage" fallback={<Forbidden />}>
        <RequireUniversity>
          {(universityId) => <TenantSettingsPanel universityId={universityId} />}
        </RequireUniversity>
      </RequirePermission>
    </div>
  );
}
