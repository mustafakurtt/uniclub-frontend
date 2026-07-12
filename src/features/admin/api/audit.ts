// Denetim izi — /api/audit (docs/DENETIM_VE_HATA.md §1). Okuma `audit.view`.
// `adminBase`'ten AYRI bir kök: `/audit/universities/:universityId`, `/admin/...` değil.
import { apiClient } from "@/shared/api/client";
import type { ApiEnvelope, AuditLogPage } from "@/shared/types";

export interface AuditLogFilters {
  limit?: number;
  cursor?: string;
  /** "bu kişi neler yaptı?" */
  actorId?: string;
  /** yetki anahtarı — "kim kullanıcı yönetti?" (ör. user.manage) */
  action?: string;
  /** "bu kayda kimler dokundu?" */
  targetId?: string;
}

export const getAuditLogs = async (
  universityId: string,
  filters?: AuditLogFilters
): Promise<AuditLogPage> => {
  const response = await apiClient.get<ApiEnvelope<AuditLogPage>>(
    `/audit/universities/${universityId}`,
    { params: { ...filters, limit: filters?.limit ?? 50 } }
  );
  return response.data.data;
};
