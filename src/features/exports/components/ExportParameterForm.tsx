import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminClubs } from "@/features/admin/api/clubs";
import { exportEnumLabel } from "@/features/exports/exportLabels";
import type { ExportReportDefinition, ExportReportParameter } from "@/shared/types";

interface ExportParameterFormProps {
  report: ExportReportDefinition;
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  universityId: string;
  fieldErrors: Record<string, string>;
}

function isClubIdParam(param: ExportReportParameter): boolean {
  return param.name === "clubId";
}

function ClubIdField({
  param,
  value,
  onChange,
  universityId,
  error,
}: {
  param: ExportReportParameter;
  value: string;
  onChange: (value: string) => void;
  universityId: string;
  error?: string;
}) {
  const clubsQuery = useQuery({
    queryKey: ["admin", universityId, "clubs", "export-picker"],
    queryFn: () => getAdminClubs(universityId),
  });

  const clubs = useMemo(
    () => [...(clubsQuery.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, "tr")),
    [clubsQuery.data]
  );

  return (
    <div>
      <label htmlFor={param.name} className="input-label">
        {param.labelTr}
        {param.required && <span className="text-red-500"> *</span>}
      </label>
      <select
        id={param.name}
        className="input-field"
        value={value}
        disabled={clubsQuery.isLoading}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{clubsQuery.isLoading ? "Kulüpler yükleniyor…" : "Kulüp seçin"}</option>
        {clubs.map((club) => (
          <option key={club.id} value={club.id}>
            {club.name}
          </option>
        ))}
      </select>
      {error && <p className="input-error mt-1">{error}</p>}
    </div>
  );
}

function ExportParameterField({
  report,
  param,
  value,
  onChange,
  universityId,
  error,
}: {
  report: ExportReportDefinition;
  param: ExportReportParameter;
  value: string;
  onChange: (value: string) => void;
  universityId: string;
  error?: string;
}) {
  if (isClubIdParam(param)) {
    return (
      <ClubIdField
        param={param}
        value={value}
        onChange={onChange}
        universityId={universityId}
        error={error}
      />
    );
  }

  if (param.type === "date") {
    return (
      <div>
        <label htmlFor={param.name} className="input-label">
          {param.labelTr}
          {param.required && <span className="text-red-500"> *</span>}
        </label>
        <input
          id={param.name}
          type="date"
          className="input-field"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {error && <p className="input-error mt-1">{error}</p>}
      </div>
    );
  }

  if (param.type === "enum") {
    return (
      <div>
        <label htmlFor={param.name} className="input-label">
          {param.labelTr}
          {param.required && <span className="text-red-500"> *</span>}
        </label>
        <select
          id={param.name}
          className="input-field"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Tümü</option>
          {(param.enumValues ?? []).map((option) => (
            <option key={option} value={option}>
              {exportEnumLabel(report.id, param.name, option)}
            </option>
          ))}
        </select>
        {error && <p className="input-error mt-1">{error}</p>}
      </div>
    );
  }

  return null;
}

export default function ExportParameterForm({
  report,
  values,
  onChange,
  universityId,
  fieldErrors,
}: ExportParameterFormProps) {
  if (report.parameters.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Bu rapor için ek filtre yok; tüm kayıtlar dışa aktarılır.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {report.parameters.map((param) => (
        <ExportParameterField
          key={param.name}
          report={report}
          param={param}
          value={values[param.name] ?? ""}
          onChange={(value) => onChange(param.name, value)}
          universityId={universityId}
          error={fieldErrors[param.name]}
        />
      ))}
    </div>
  );
}
