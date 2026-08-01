import { useEffect, useMemo, useState } from "react";
import { exportErrorHint, generateExport } from "@/features/exports/api/exports";
import { buildExportRequestBody } from "@/features/exports/buildExportBody";
import ExportFormFields from "@/features/exports/components/ExportFormFields";
import {
  downloadLabel,
  formatBadge,
  groupCatalog,
  reportDescription,
} from "@/features/exports/reportMeta";
import { Icon } from "@/shared/ui/Icon";
import type { ExportReportDefinition } from "@/shared/types";

interface ExportsWorkspaceProps {
  reports: ExportReportDefinition[];
  universityId: string;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function NavSection({
  title,
  reports,
  selectedId,
  onSelect,
}: {
  title: string;
  reports: ExportReportDefinition[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (reports.length === 0) return null;

  return (
    <div>
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </p>
      <ul className="space-y-0.5">
        {reports.map((report) => {
          const active = report.id === selectedId;
          return (
            <li key={report.id}>
              <button
                type="button"
                onClick={() => onSelect(report.id)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  active
                    ? "bg-brand-600 text-white shadow-glow"
                    : "text-slate-600 hover:bg-white hover:text-brand-700"
                }`}
              >
                <Icon
                  name={report.format === "pdf" ? "literature" : "archive"}
                  size={16}
                  className={active ? "text-white" : "text-slate-400"}
                />
                <span className="min-w-0 flex-1 truncate">{report.labelTr}</span>
                <span
                  className={`shrink-0 text-[10px] font-bold ${
                    active ? "text-white/80" : "text-slate-400"
                  }`}
                >
                  {formatBadge(report.format)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ExportPanel({
  report,
  universityId,
}: {
  report: ExportReportDefinition;
  universityId: string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const hasOptional = report.parameters.some((p) => !p.required);

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleDownload = async () => {
    setFormError(null);
    setNote(null);
    const { body, errors: nextErrors } = buildExportRequestBody(report, values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const file = await generateExport(universityId, report.id, body, report.format);
      triggerDownload(file.blob, file.filename);
      if (file.usedCsvFallback) {
        setNote("Excel üretilemedi; dosya CSV olarak indirildi.");
      }
    } catch (err) {
      const code = (err as { code?: string | null }).code ?? null;
      setFormError(
        exportErrorHint(code) ??
          (err instanceof Error ? err.message : "Rapor üretilemedi.")
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-slate-100 px-6 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl font-bold text-slate-900">{report.labelTr}</h2>
          <span className="chip">{formatBadge(report.format)}</span>
        </div>
        <p className="mt-1 text-sm text-slate-500">{reportDescription(report)}</p>
      </header>

      <div className="flex-1 px-6 py-5">
        <ExportFormFields
          report={report}
          values={values}
          errors={errors}
          universityId={universityId}
          onChange={handleChange}
        />
        {formError ? <div className="alert-error mt-4 text-sm">{formError}</div> : null}
        {note ? (
          <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {note}
          </p>
        ) : null}
      </div>

      <footer className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        {hasOptional ? (
          <p className="text-xs text-slate-400">
            İsteğe bağlı filtreleri boş bırakırsanız tüm kayıtlar dışa aktarılır.
          </p>
        ) : (
          <span className="hidden sm:block" />
        )}
        <button
          type="button"
          className="btn-primary w-full sm:w-auto"
          disabled={busy}
          onClick={handleDownload}
        >
          {busy ? (
            <>
              <Icon name="pending" size={16} className="animate-spin" />
              Hazırlanıyor…
            </>
          ) : (
            <>
              <Icon name={report.format === "pdf" ? "literature" : "archive"} size={16} />
              {downloadLabel(report.format)}
            </>
          )}
        </button>
      </footer>
    </div>
  );
}

export default function ExportsWorkspace({ reports, universityId }: ExportsWorkspaceProps) {
  const { tables, documents } = useMemo(() => groupCatalog(reports), [reports]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    const fallback = tables[0]?.id ?? documents[0]?.id ?? "";
    setSelectedId((current) =>
      current && reports.some((r) => r.id === current) ? current : fallback
    );
  }, [reports, tables, documents]);

  const selected = reports.find((r) => r.id === selectedId);

  return (
    <div className="card overflow-hidden p-0">
      <div className="flex flex-col lg:flex-row lg:min-h-[32rem]">
        <nav className="shrink-0 border-b border-slate-100 bg-slate-50/80 p-4 lg:w-72 lg:border-b-0 lg:border-r">
          <div className="space-y-5">
            <NavSection
              title="Veri tabloları"
              reports={tables}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            <NavSection
              title="Resmî belgeler"
              reports={documents}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        </nav>

        <div className="min-w-0 flex-1 bg-white">
          {selected ? (
            <ExportPanel key={selected.id} report={selected} universityId={universityId} />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-sm text-slate-500">
              Görüntülenecek rapor bulunamadı.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
