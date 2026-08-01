import { useEffect, useMemo, useState } from "react";
import ExportReportDetail from "@/features/exports/components/ExportReportDetail";
import ExportReportListItem from "@/features/exports/components/ExportReportListItem";
import { groupExportReports } from "@/features/exports/reportDescriptions";
import type { ExportReportDefinition } from "@/shared/types";

interface ExportCatalogLayoutProps {
  reports: ExportReportDefinition[];
  universityId: string;
}

function ExportReportGroup({
  title,
  reports,
  selectedId,
  onSelect,
}: {
  title: string;
  reports: ExportReportDefinition[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (reports.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {title}
      </h2>
      <ul className="flex flex-col gap-1.5">
        {reports.map((report) => (
          <li key={report.id}>
            <ExportReportListItem
              report={report}
              selected={report.id === selectedId}
              onSelect={() => onSelect(report.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ExportCatalogLayout({ reports, universityId }: ExportCatalogLayoutProps) {
  const { tables, documents } = useMemo(() => groupExportReports(reports), [reports]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  useEffect(() => {
    const first = tables[0] ?? documents[0];
    setSelectedReportId((current) => {
      if (current && reports.some((r) => r.id === current)) return current;
      return first?.id ?? null;
    });
  }, [reports, tables, documents]);

  const selectedReport = reports.find((r) => r.id === selectedReportId) ?? null;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 space-y-5 lg:w-80">
        <ExportReportGroup
          title="Veri tabloları"
          reports={tables}
          selectedId={selectedReportId}
          onSelect={setSelectedReportId}
        />
        <ExportReportGroup
          title="Resmî belgeler"
          reports={documents}
          selectedId={selectedReportId}
          onSelect={setSelectedReportId}
        />
      </aside>

      <div className="min-w-0 flex-1">
        {selectedReport ? (
          <div className="card">
            <ExportReportDetail
              key={selectedReport.id}
              report={selectedReport}
              universityId={universityId}
            />
          </div>
        ) : (
          <div className="card text-sm text-slate-500">Görüntülenecek rapor bulunamadı.</div>
        )}
      </div>
    </div>
  );
}
