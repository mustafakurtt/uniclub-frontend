import RequireUniversity from "@/features/admin/components/RequireUniversity";
import TenantSettingsPanel from "@/features/admin/components/tenant-settings/TenantSettingsPanel";
import RequirePermission from "@/features/auth/guards/RequirePermission";
import Forbidden from "@/features/auth/pages/Forbidden";

// Üniversite politikaları — metadata-driven form (FRONTEND_TENANT_SETTINGS.md)
export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">
          Üniversite Politikaları
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
          Duyuru sabitleme, yayın hızı ve kulüp kuruluş onay akışı gibi kampüs genelindeki
          kuralları buradan yönetin. Değişiklikler kaydedildiğinde anında uygulanır.
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
