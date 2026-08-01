import type { ExportReportDefinition } from "@/shared/types";

function isClubIdParam(name: string): boolean {
  return name === "clubId";
}

function isApplicationIdParam(name: string): boolean {
  return name === "applicationId";
}

function requiredFieldMessage(name: string): string {
  if (isClubIdParam(name)) return "Kulüp seçimi zorunludur.";
  if (isApplicationIdParam(name)) return "Başvuru seçimi zorunludur.";
  return "Bu alan zorunludur.";
}

export function buildExportRequestBody(
  report: ExportReportDefinition,
  values: Record<string, string>
): { body: Record<string, string | number>; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const body: Record<string, string | number> = {};

  for (const param of report.parameters) {
    const raw = values[param.name]?.trim() ?? "";
    if (!raw) {
      if (param.required) {
        errors[param.name] = requiredFieldMessage(param.name);
      }
      continue;
    }

    if (param.type === "date") {
      body[param.name] = `${raw}T00:00:00.000Z`;
    } else if (param.type === "integer" || param.name === "year") {
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) {
        errors[param.name] = "Geçerli bir sayı girin.";
        continue;
      }
      body[param.name] = parsed;
    } else {
      body[param.name] = raw;
    }
  }

  return { body, errors };
}
