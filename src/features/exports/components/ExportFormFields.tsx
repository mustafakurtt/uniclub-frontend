import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getClubApplications } from "@/features/admin/api/applications";
import { getAdminClubs } from "@/features/admin/api/clubs";
import { APPLICATION_STATUS_LABELS } from "@/features/clubs/applicationLabels";
import { exportEnumLabel } from "@/features/exports/exportLabels";
import { layoutParameters } from "@/features/exports/reportMeta";
import type { ExportReportDefinition, ExportReportParameter } from "@/shared/types";

interface ExportFormFieldsProps {
  report: ExportReportDefinition;
  values: Record<string, string>;
  errors: Record<string, string>;
  universityId: string;
  onChange: (name: string, value: string) => void;
}

function Field({
  label,
  required,
  error,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full min-w-0">
      <label htmlFor={htmlFor} className="input-label">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? <p className="input-error mt-1.5">{error}</p> : null}
    </div>
  );
}

function ClubSelect({
  param,
  value,
  error,
  universityId,
  onChange,
}: {
  param: ExportReportParameter;
  value: string;
  error?: string;
  universityId: string;
  onChange: (value: string) => void;
}) {
  const query = useQuery({
    queryKey: ["exports", universityId, "clubs"],
    queryFn: () => getAdminClubs(universityId),
  });
  const clubs = useMemo(
    () => [...(query.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, "tr")),
    [query.data]
  );

  return (
    <Field label={param.labelTr} required={param.required} error={error} htmlFor={param.name}>
      <select
        id={param.name}
        className="select-field w-full"
        value={value}
        disabled={query.isLoading}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{query.isLoading ? "Yükleniyor…" : "Kulüp seçin"}</option>
        {clubs.map((club) => (
          <option key={club.id} value={club.id}>
            {club.name}
          </option>
        ))}
      </select>
    </Field>
  );
}

function ApplicationSelect({
  param,
  value,
  error,
  universityId,
  onChange,
}: {
  param: ExportReportParameter;
  value: string;
  error?: string;
  universityId: string;
  onChange: (value: string) => void;
}) {
  const query = useQuery({
    queryKey: ["exports", universityId, "applications"],
    queryFn: () => getClubApplications(universityId),
  });
  const applications = useMemo(
    () =>
      [...(query.data ?? [])].sort((a, b) =>
        a.proposedName.localeCompare(b.proposedName, "tr")
      ),
    [query.data]
  );

  return (
    <Field label={param.labelTr} required={param.required} error={error} htmlFor={param.name}>
      <select
        id={param.name}
        className="select-field w-full"
        value={value}
        disabled={query.isLoading}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{query.isLoading ? "Yükleniyor…" : "Başvuru seçin"}</option>
        {applications.map((app) => (
          <option key={app.id} value={app.id}>
            {app.proposedName} · {APPLICATION_STATUS_LABELS[app.status]}
          </option>
        ))}
      </select>
    </Field>
  );
}

function ParamInput({
  report,
  param,
  value,
  error,
  universityId,
  onChange,
}: {
  report: ExportReportDefinition;
  param: ExportReportParameter;
  value: string;
  error?: string;
  universityId: string;
  onChange: (value: string) => void;
}) {
  if (param.name === "clubId") {
    return (
      <ClubSelect
        param={param}
        value={value}
        error={error}
        universityId={universityId}
        onChange={onChange}
      />
    );
  }
  if (param.name === "applicationId") {
    return (
      <ApplicationSelect
        param={param}
        value={value}
        error={error}
        universityId={universityId}
        onChange={onChange}
      />
    );
  }
  if (param.name === "year" || param.type === "integer") {
    const year = new Date().getFullYear();
    return (
      <Field label={param.labelTr} required={param.required} error={error} htmlFor={param.name}>
        <input
          id={param.name}
          type="number"
          min={2000}
          max={year + 1}
          className="input-field w-full max-w-[12rem]"
          value={value}
          placeholder={String(year)}
          onChange={(e) => onChange(e.target.value)}
        />
      </Field>
    );
  }
  if (param.type === "date") {
    return (
      <Field label={param.labelTr} required={param.required} error={error} htmlFor={param.name}>
        <input
          id={param.name}
          type="date"
          className="select-field w-full"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </Field>
    );
  }
  if (param.type === "enum") {
    return (
      <Field label={param.labelTr} required={param.required} error={error} htmlFor={param.name}>
        <select
          id={param.name}
          className="select-field w-full"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Tümü</option>
          {(param.enumValues ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {exportEnumLabel(report.id, param.name, opt)}
            </option>
          ))}
        </select>
      </Field>
    );
  }
  return null;
}

export default function ExportFormFields({
  report,
  values,
  errors,
  universityId,
  onChange,
}: ExportFormFieldsProps) {
  if (report.parameters.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Ek filtre gerekmez; doğrudan indirebilirsiniz.
      </p>
    );
  }

  const blocks = layoutParameters(report.parameters);

  return (
    <div className="flex w-full flex-col gap-5">
      {blocks.map((block) => {
        if (block.kind === "dateRange") {
          return (
            <div
              key={`${block.from.name}-${block.to.name}`}
              className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2"
            >
              <ParamInput
                report={report}
                param={block.from}
                value={values[block.from.name] ?? ""}
                error={errors[block.from.name]}
                universityId={universityId}
                onChange={(v) => onChange(block.from.name, v)}
              />
              <ParamInput
                report={report}
                param={block.to}
                value={values[block.to.name] ?? ""}
                error={errors[block.to.name]}
                universityId={universityId}
                onChange={(v) => onChange(block.to.name, v)}
              />
            </div>
          );
        }
        return (
          <ParamInput
            key={block.param.name}
            report={report}
            param={block.param}
            value={values[block.param.name] ?? ""}
            error={errors[block.param.name]}
            universityId={universityId}
            onChange={(v) => onChange(block.param.name, v)}
          />
        );
      })}
    </div>
  );
}
