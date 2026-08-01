// Kurumsal rapor dışa aktarma — docs/architecture/FRONTEND_EXPORTS.md

export type ExportParamType = "string" | "date" | "enum";

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
  parameters: ExportReportParameter[];
}

export type ExportParamsBody = Record<string, string>;
