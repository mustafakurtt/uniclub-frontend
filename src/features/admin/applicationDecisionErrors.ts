import { getErrorCode, getErrorMessage } from "@/shared/api/client";

/** Backend iş kuralı kodları — mesaj metnine değil buna bak (T4.1). */
export const ADMIN_APPLICATION_ERROR_CODES = {
  CHECKLIST_REQUIRED_INCOMPLETE: "admin.checklistRequiredIncomplete",
} as const;

export function getApplicationDecisionErrorMessage(error: unknown, fallback: string): string {
  const code = getErrorCode(error);
  if (code === ADMIN_APPLICATION_ERROR_CODES.CHECKLIST_REQUIRED_INCOMPLETE) {
    return "Zorunlu kontrol maddeleri işaretlenmeden onaylanamaz.";
  }
  return getErrorMessage(error, fallback);
}
