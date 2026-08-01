// Tenant ayarları — /api/universities/:universityId/settings (FRONTEND_TENANT_SETTINGS.md)
import { apiClient } from "@/shared/api/client";
import type { ApiEnvelope, TenantSettingsPatch, TenantSettingsResponse } from "@/shared/types";

export const getTenantSettings = async (universityId: string): Promise<TenantSettingsResponse> => {
  const response = await apiClient.get<ApiEnvelope<TenantSettingsResponse>>(
    `/universities/${universityId}/settings`
  );
  return response.data.data;
};

export const patchTenantSettings = async (
  universityId: string,
  settings: TenantSettingsPatch
): Promise<TenantSettingsResponse> => {
  const response = await apiClient.patch<ApiEnvelope<TenantSettingsResponse>>(
    `/universities/${universityId}/settings`,
    { settings }
  );
  return response.data.data;
};
