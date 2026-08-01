import { useState } from "react";
import { exportErrorHint, generateExport } from "@/features/exports/api/exports";
import { buildExportRequestBody } from "@/features/exports/buildExportBody";
import ExportParameterForm from "@/features/exports/components/ExportParameterForm";
import { exportFormatLabel, exportReportDescription } from "@/features/exports/reportDescriptions";
import { Icon } from "@/shared/ui/Icon";
import type { ExportReportDefinition } from "@/shared/types";

interface ExportReportDetailProps {
  report: ExportReportDefinition;
  universityId: string;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ExportReportDetail({ report, universityId }: ExportReportDetailProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [fallbackNote, setFallbackNote] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const downloadLabel = report.format === "pdf" ? "PDF indir" : "Excel indir";

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
      const result = await generateExport(universityId, report.id, body, report.format);
      triggerDownload(result.blob, result.filename);
      if (result.usedCsvFallback) {
        setFallbackNote("Excel üretilemedi; dosya CSV olarak indirildi.");
      }
    } catch (error) {
      const code = (error as { code?: string | null }).code ?? null;
      const hint = exportErrorHint(code);
      const message = hint ?? (error instanceof Error ? error.message : "Rapor üretilemedi.");
      setDownloadError(message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-bold text-slate-900">{report.labelTr}</h2>
          <span className="chip">{exportFormatLabel(report.format)}</span>
        </div>
        <p className="mt-1 text-sm text-slate-500">{exportReportDescription(report)}</p>
      </div>

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

      <button type="button" className="btn-primary" disabled={downloading} onClick={handleDownload}>
        {downloading ? (
          <>
            <Icon name="pending" size={16} className="animate-spin" />
            Hazırlanıyor…
          </>
        ) : (
          <>
            <Icon name={report.format === "pdf" ? "literature" : "archive"} size={16} />
            {downloadLabel}
          </>
        )}
      </button>
    </div>
  );
}
