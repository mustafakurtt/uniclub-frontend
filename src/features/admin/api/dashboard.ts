import { apiClient } from "@/shared/api/client";
import type { AdminDashboard, ApiEnvelope } from "@/shared/types";
import { adminBase } from "./_base";

export const getAdminDashboard = async (universityId: string): Promise<AdminDashboard> => {
  const response = await apiClient.get<ApiEnvelope<AdminDashboard>>(
    `${adminBase(universityId)}/dashboard`,
  );
  return response.data.data;
};
