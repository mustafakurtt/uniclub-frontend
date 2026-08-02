import { apiClient } from "@/shared/api/client";
import type {
  ApiEnvelope,
  InviteTenantAdminDto,
  OnboardTenantDto,
  OnboardTenantResult,
  TenantAdminInvitation,
  TenantListPage,
  UpdateTenantStatusDto,
  University,
} from "@/shared/types";

export interface ListTenantsParams {
  limit?: number;
  cursor?: string;
  search?: string;
}

export const listPlatformTenants = async (
  params: ListTenantsParams = {},
): Promise<TenantListPage> => {
  const response = await apiClient.get<ApiEnvelope<TenantListPage>>("/platform/tenants", {
    params,
  });
  return response.data.data;
};

export const onboardPlatformTenant = async (
  dto: OnboardTenantDto,
): Promise<OnboardTenantResult> => {
  const response = await apiClient.post<ApiEnvelope<OnboardTenantResult>>(
    "/platform/tenants/onboard",
    dto,
  );
  return response.data.data;
};

export const updatePlatformTenantStatus = async (
  universityId: string,
  dto: UpdateTenantStatusDto,
): Promise<University> => {
  const response = await apiClient.patch<ApiEnvelope<University>>(
    `/platform/tenants/${universityId}/status`,
    dto,
  );
  return response.data.data;
};

export const listTenantAdminInvitations = async (
  universityId: string,
): Promise<TenantAdminInvitation[]> => {
  const response = await apiClient.get<ApiEnvelope<TenantAdminInvitation[]>>(
    `/platform/tenants/${universityId}/invitations`,
  );
  return response.data.data;
};

export const inviteTenantAdmin = async (
  universityId: string,
  dto: InviteTenantAdminDto,
): Promise<TenantAdminInvitation> => {
  const response = await apiClient.post<ApiEnvelope<TenantAdminInvitation>>(
    `/platform/tenants/${universityId}/invite-admin`,
    dto,
  );
  return response.data.data;
};

export const cancelTenantAdminInvitation = async (
  universityId: string,
  invitationId: string,
): Promise<TenantAdminInvitation> => {
  const response = await apiClient.post<ApiEnvelope<TenantAdminInvitation>>(
    `/platform/tenants/${universityId}/invitations/${invitationId}/cancel`,
  );
  return response.data.data;
};
