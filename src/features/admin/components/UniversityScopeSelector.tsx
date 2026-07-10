import { useAdminScope } from "@/features/admin/context/AdminScopeContext";
import { Icon } from "@/shared/ui/Icon";

/**
 * Üniversite seçici — yalnızca birden çok tenant'a erişimi olan hesaplarda
 * (platform çalışanları) görünür. Tek üniversiteli yöneticide seçilecek bir şey
 * yoktur; seçici yerine sadece tenant adı gösterilir.
 */
export default function UniversityScopeSelector() {
  const { universities, universityId, university, canSelect, setUniversityId, isLoading } =
    useAdminScope();

  if (isLoading || universities.length === 0) return null;

  if (!canSelect) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-brand-50/70 px-3 py-2">
        <Icon name="university" size={16} className="shrink-0 text-brand-600" />
        <p className="truncate text-xs font-semibold text-brand-800">{university?.name}</p>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="admin-scope" className="input-label text-xs">
        Yönetilen Üniversite
      </label>
      <select
        id="admin-scope"
        className="select-field py-2 text-sm"
        value={universityId ?? ""}
        onChange={(e) => setUniversityId(e.target.value)}
      >
        {universities.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
    </div>
  );
}
