import type { ExportReportDefinition, ExportReportFormat, ExportReportParameter } from "@/shared/types";

const DESCRIPTIONS: Record<string, string> = {
  clubs: "Kurumdaki kulüplerin listesi ve durumları.",
  "club-members": "Seçilen kulübün üye kayıtları ve rolleri.",
  activities: "Kulüp etkinliklerinin takvim listesi.",
  "annual-activity-report": "Seçilen yıl için yıllık faaliyet raporu.",
  "application-decision-minutes": "Kulüp başvurusuna ait resmî karar tutanağı.",
};

export function reportDescription(report: ExportReportDefinition): string {
  return DESCRIPTIONS[report.id] ?? report.labelTr;
}

export function formatBadge(format: ExportReportFormat): string {
  return format === "pdf" ? "PDF" : "Excel";
}

export function downloadLabel(format: ExportReportFormat): string {
  return format === "pdf" ? "PDF indir" : "Excel indir";
}

export function groupCatalog(reports: ExportReportDefinition[]) {
  return {
    tables: reports.filter((r) => r.format === "xlsx"),
    documents: reports.filter((r) => r.format === "pdf"),
  };
}

type ParamBlock =
  | { kind: "field"; param: ExportReportParameter }
  | { kind: "dateRange"; from: ExportReportParameter; to: ExportReportParameter };

function isDateRange(from: ExportReportParameter, to: ExportReportParameter): boolean {
  return (
    from.type === "date" &&
    to.type === "date" &&
    ((from.name === "createdFrom" && to.name === "createdTo") ||
      (from.name === "from" && to.name === "to"))
  );
}

/** Parametreleri formda render sırasına göre gruplar; tarih çiftleri yan yana. */
export function layoutParameters(params: ExportReportParameter[]): ParamBlock[] {
  const blocks: ParamBlock[] = [];
  let i = 0;
  while (i < params.length) {
    const current = params[i];
    const next = params[i + 1];
    if (next && isDateRange(current, next)) {
      blocks.push({ kind: "dateRange", from: current, to: next });
      i += 2;
    } else {
      blocks.push({ kind: "field", param: current });
      i += 1;
    }
  }
  return blocks;
}
