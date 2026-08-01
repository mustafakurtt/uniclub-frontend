import RequireUniversity from "@/features/admin/components/RequireUniversity";
import RequirePermission from "@/features/auth/guards/RequirePermission";
import Forbidden from "@/features/auth/pages/Forbidden";
import { getErrorMessage } from "@/shared/api/client";
import ExportReportPanel from "@/features/exports/components/ExportReportPanel";
import { resolveExportCatalog, useExportCatalog } from "@/features/exports/hooks/useExportCatalog";
import EmptyState from "@/shared/ui/EmptyState";
import PageLoader from "@/shared/ui/PageLoader";
import { useState } from "react";

function ExportsContent({ universityId }: { universityId: string }) {
  const catalogQuery = useExportCatalog(universityId, true);
  const catalog = resolveExportCatalog(catalogQuery);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  if (catalog.status === "loading") {
    return <PageLoader label="Rapor kataloğu yükleniyor..." />;
  }

  if (catalog.status === "disabled") {
    return (
      <EmptyState
        icon="archive"
        title="Bu kurumda rapor dışa aktarma etkin değil"
        description="Kurumsal rapor özelliği yöneticiniz tarafından açılmamış. Bilgi için üniversite yönetimine başvurun."
      />
    );
  }

  if (catalog.status === "error") {
    return (
      <div className="alert-error">
        {getErrorMessage(catalog.error, "Rapor kataloğu yüklenemedi.")}
      </div>
    );
  }

  const selectedId = selectedReportId ?? catalog.reports[0]?.id ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {catalog.reports.map((report) => (
        <ExportReportPanel
          key={report.id}
          report={report}
          universityId={universityId}
          selected={report.id === selectedId}
          onSelect={() => setSelectedReportId(report.id)}
        />
      ))}
    </div>
  );
}

export default function AdminExports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Raporlar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kulüp, üye ve etkinlik verilerini resmî Excel formatında indirin.
        </p>
      </div>

      <RequirePermission permission="university.export.generate" fallback={<Forbidden />}>
        <RequireUniversity>{(universityId) => <ExportsContent universityId={universityId} />}</RequireUniversity>
      </RequirePermission>
    </div>
  );
}
