import { exportFormatLabel, exportReportDescription } from "@/features/exports/reportDescriptions";
import { Icon, type IconName } from "@/shared/ui/Icon";
import type { ExportReportDefinition } from "@/shared/types";

interface ExportReportListItemProps {
  report: ExportReportDefinition;
  selected: boolean;
  onSelect: () => void;
}

function formatIcon(format: ExportReportDefinition["format"]): IconName {
  return format === "pdf" ? "literature" : "archive";
}

export default function ExportReportListItem({ report, selected, onSelect }: ExportReportListItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
        selected
          ? "border-brand-300 bg-brand-50 shadow-sm ring-1 ring-brand-100"
          : "border-transparent hover:border-slate-200 hover:bg-white/80"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          selected ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"
        }`}
      >
        <Icon name={formatIcon(report.format)} size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-sm font-bold text-slate-900">{report.labelTr}</span>
          <span className="chip text-[10px]">{exportFormatLabel(report.format)}</span>
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
          {exportReportDescription(report)}
        </p>
      </div>
    </button>
  );
}
