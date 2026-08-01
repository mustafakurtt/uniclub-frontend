import { NavLink } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAdminScope } from "@/features/admin/context/AdminScopeContext";
import { resolveExportCatalog, useExportCatalog } from "@/features/exports/hooks/useExportCatalog";
import { Icon } from "@/shared/ui/Icon";

interface ExportsNavItemProps {
  navLinkClass: ({ isActive }: { isActive: boolean }) => string;
}

export default function ExportsNavItem({ navLinkClass }: ExportsNavItemProps) {
  const { hasPermission } = useAuth();
  const { universityId } = useAdminScope();
  const canExport = hasPermission("university.export.generate");
  const catalogQuery = useExportCatalog(universityId, canExport);
  const catalog = resolveExportCatalog(catalogQuery);

  if (!canExport || catalog.status === "disabled" || catalog.status === "loading") {
    return null;
  }

  if (catalog.status === "error") {
    return null;
  }

  return (
    <NavLink to="/admin/exports" className={navLinkClass}>
      <Icon name="archive" size={18} />
      Raporlar
    </NavLink>
  );
}
