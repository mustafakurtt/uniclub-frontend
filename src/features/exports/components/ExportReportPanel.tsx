import { useState } from "react";
import {
  exportErrorHint,
  generateExport,
} from "@/features/exports/api/exports";
import ExportParameterForm from "@/features/exports/components/ExportParameterForm";
import { buildExportRequestBody } from "@/features/exports/buildExportBody";
import { Icon } from "@/shared/ui/Icon";
import type { ExportReportDefinition } from "@/shared/types";

interface ExportReportPanelProps {
  report: ExportReportDefinition;
  universityId: string;
  selected: boolean;
  onSelect: () => void;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ExportReportPanel({
  report,
  universityId,
  selected,
  onSelect,
}: ExportReportPanelProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [fallbackNote, setFallbackNote] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloadError(null);
    setFallbackNote(null);

    const { body, errors } = buildExportRequestBody(report, values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setDownloading(true);
    try {
      const result = await generateExport(universityId, report.id, body);
      triggerDownload(result.blob, result.filename);
      if (result.usedCsvFallback) {
        setFallbackNote("Excel üretilemedi; dosya CSV olarak indirildi.");
      }
    } catch (error) {
      const code = (error as { code?: string | null }).code ?? null;
      const hint = exportErrorHint(code);
      const message =
        hint ??
        (error instanceof Error ? error.message : "Rapor üretilemedi.");
      setDownloadError(message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className={`card transition-all ${
        selected ? "border-brand-300 ring-2 ring-brand-100" : "card-hover cursor-pointer"
      }`}
      onClick={!selected ? onSelect : undefined}
      onKeyDown={
        !selected
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onSelect();
            }
          : undefined
      }
      role={selected ? undefined : "button"}
      tabIndex={selected ? undefined : 0}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon name="archive" size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-bold text-slate-900">{report.labelTr}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {report.parameters.length > 0
              ? `${report.parameters.length} filtre alanı`
              : "Filtresiz tam liste"}
          </p>
        </div>
      </div>

      {selected && (
        <div className="mt-5 space-y-4 border-t border-slate-100 pt-5" onClick={(e) => e.stopPropagation()}>
          <ExportParameterForm
            report={report}
            values={values}
            onChange={(name, value) => {
              setValues((prev) => ({ ...prev, [name]: value }));
              setFieldErrors((prev) => {
                if (!prev[name]) return prev;
                const next = { ...prev };
                delete next[name];
                return next;
              });
            }}
            universityId={universityId}
            fieldErrors={fieldErrors}
          />

          {downloadError && <div className="alert-error text-sm">{downloadError}</div>}
          {fallbackNote && (
            <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {fallbackNote}
            </p>
          )}

          <button
            type="button"
            className="btn-primary"
            disabled={downloading}
            onClick={handleDownload}
          >
            {downloading ? (
              <>
                <Icon name="pending" size={16} className="animate-spin" />
                Hazırlanıyor…
              </>
            ) : (
              <>
                <Icon name="archive" size={16} />
                İndir
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
