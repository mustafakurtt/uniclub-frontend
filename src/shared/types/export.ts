// Kurumsal rapor dışa aktarma — docs/architecture/FRONTEND_EXPORTS.md

export type ExportReportFormat = "xlsx" | "pdf";

export type ExportParamType = "string" | "date" | "enum" | "integer";

export interface ExportReportParameter {
  name: string;
  type: ExportParamType;
  required?: boolean;
  labelTr: string;
  labelEn: string;
  enumValues?: string[];
}

export interface ExportReportDefinition {
  id: string;
  labelTr: string;
  labelEn: string;
  format: ExportReportFormat;
  parameters: ExportReportParameter[];
}

export type ExportParamsBody = Record<string, string | number>;
