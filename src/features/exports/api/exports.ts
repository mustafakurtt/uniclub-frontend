import axios from "axios";
import { apiClient, getErrorCode, getErrorMessage } from "@/shared/api/client";
import type { ApiEnvelope, ExportParamsBody, ExportReportDefinition, ExportReportFormat } from "@/shared/types";

export const EXPORT_ERROR_CODES = {
  ROW_LIMIT_EXCEEDED: "exports.rowLimitExceeded",
  REPORT_NOT_FOUND: "exports.reportNotFound",
  CLUB_NOT_FOUND: "exports.clubNotFound",
} as const;

export const getExportCatalog = async (universityId: string): Promise<ExportReportDefinition[]> => {
  const response = await apiClient.get<ApiEnvelope<ExportReportDefinition[]>>(
    `/universities/${universityId}/exports`
  );
  return response.data.data.map((report) => ({
    ...report,
    format: report.format ?? "xlsx",
  }));
};

export interface GeneratedExportFile {
  blob: Blob;
  filename: string;
  usedCsvFallback: boolean;
}

function parseContentDispositionFilename(header: string | undefined): string | null {
  if (!header) return null;
  const quoted = /filename="([^"]+)"/i.exec(header);
  if (quoted?.[1]) return quoted[1];
  const unquoted = /filename=([^;]+)/i.exec(header);
  return unquoted?.[1]?.trim() ?? null;
}

async function parseBlobError(error: unknown): Promise<{ message: string; code: string | null }> {
  if (!axios.isAxiosError(error) || !(error.response?.data instanceof Blob)) {
    return {
      message: getErrorMessage(error, "Rapor üretilemedi."),
      code: getErrorCode(error),
    };
  }
  try {
    const text = await error.response.data.text();
    const body = JSON.parse(text) as { message?: string; code?: string };
    return {
      message: typeof body.message === "string" ? body.message : "Rapor üretilemedi.",
      code: typeof body.code === "string" ? body.code : null,
    };
  } catch {
    return { message: "Rapor üretilemedi.", code: null };
  }
}

export const generateExport = async (
  universityId: string,
  reportId: string,
  params: ExportParamsBody,
  format: ExportReportFormat = "xlsx"
): Promise<GeneratedExportFile> => {
  try {
    const response = await apiClient.post(
      `/universities/${universityId}/exports/${reportId}`,
      params,
      { responseType: "blob" }
    );

    const filename =
      parseContentDispositionFilename(response.headers["content-disposition"]) ??
      `${reportId}.${format === "pdf" ? "pdf" : "xlsx"}`;
    const usedCsvFallback = response.headers["x-export-fallback"] === "csv";

    return {
      blob: response.data as Blob,
      filename,
      usedCsvFallback,
    };
  } catch (error) {
    const parsed = await parseBlobError(error);
    const err = new Error(parsed.message) as Error & { code?: string | null; status?: number };
    err.code = parsed.code ?? getErrorCode(error);
    if (axios.isAxiosError(error)) {
      err.status = error.response?.status;
    }
    throw err;
  }
};

export function exportErrorHint(code: string | null): string | null {
  switch (code) {
    case EXPORT_ERROR_CODES.ROW_LIMIT_EXCEEDED:
      return "Sonuç çok büyük. Lütfen tarih aralığını veya diğer filtreleri daraltın.";
    case EXPORT_ERROR_CODES.CLUB_NOT_FOUND:
      return "Seçilen kulüp bulunamadı.";
    case EXPORT_ERROR_CODES.REPORT_NOT_FOUND:
      return "Rapor tanımı bulunamadı.";
    default:
      return null;
  }
}
