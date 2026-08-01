import type { ExportReportDefinition, ExportReportFormat } from "@/shared/types";

const EXPORT_REPORT_DESCRIPTIONS: Record<string, string> = {
  clubs: "Kurumdaki kulüplerin listesi ve durumları.",
  "club-members": "Seçilen kulübün üye kayıtları ve rolleri.",
  activities: "Kulüp etkinliklerinin takvim listesi.",
  "annual-activity-report": "Seçilen yıl için yıllık faaliyet raporu.",
  "application-decision-minutes": "Kulüp başvurusuna ait resmî karar tutanağı.",
};

export function exportReportDescription(report: ExportReportDefinition): string {
  return EXPORT_REPORT_DESCRIPTIONS[report.id] ?? report.labelTr;
}

export function exportFormatLabel(format: ExportReportFormat): string {
  return format === "pdf" ? "PDF" : "Excel";
}

export function groupExportReports(reports: ExportReportDefinition[]) {
  return {
    tables: reports.filter((r) => r.format === "xlsx"),
    documents: reports.filter((r) => r.format === "pdf"),
  };
}
