import type { ExportReportDefinition } from "@/shared/types";

function isClubIdParam(name: string): boolean {
  return name === "clubId";
}

export function buildExportRequestBody(
  report: ExportReportDefinition,
  values: Record<string, string>
): { body: Record<string, string>; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const body: Record<string, string> = {};

  for (const param of report.parameters) {
    const raw = values[param.name]?.trim() ?? "";
    if (!raw) {
      if (param.required) {
        errors[param.name] = isClubIdParam(param.name)
          ? "Kulüp seçimi zorunludur."
          : "Bu alan zorunludur.";
      }
      continue;
    }
    body[param.name] = param.type === "date" ? `${raw}T00:00:00.000Z` : raw;
  }

  return { body, errors };
}
