import { AdminScopeProvider } from "@/features/admin/context/AdminScopeContext";
import AdminLayoutShell from "@/layouts/AdminLayoutShell";
import AdminPanelErrorBoundary from "@/layouts/AdminPanelErrorBoundary";

export default function AdminLayout() {
  return (
    <AdminPanelErrorBoundary>
      <AdminScopeProvider>
        <AdminLayoutShell />
      </AdminScopeProvider>
    </AdminPanelErrorBoundary>
  );
}
