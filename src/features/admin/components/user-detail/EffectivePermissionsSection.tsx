// Etkin (effective) yetkiler — salt bilgi. Roller + kişisel override'ların birleşimi.
import { permissionLabel } from "@/features/admin/labels";
import type { GlobalPermission } from "@/shared/types";

export default function EffectivePermissionsSection({
  permissions,
}: {
  permissions: GlobalPermission[];
}) {
  return (
    <section>
      <h3 className="input-label">Etkin Yetkiler ({permissions.length})</h3>
      {permissions.length === 0 ? (
        <p className="text-xs text-slate-400">Yönetim yetkisi yok (temel kullanıcı).</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {[...permissions].sort().map((p) => (
            <span
              key={p}
              className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600"
              title={permissionLabel(p)}
            >
              {p}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
