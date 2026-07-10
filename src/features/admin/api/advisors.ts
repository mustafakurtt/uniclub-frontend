// Danışman yönetimi — okuma `club.view`, yazma `club.advisor.manage` (§5.4)
import { apiClient } from "@/shared/api/client";
import type { ApiEnvelope, SafeUser } from "@/shared/types";
import { adminBase } from "./_base";

export const getClubAdvisors = async (
  universityId: string,
  clubId: string
): Promise<SafeUser[]> => {
  const response = await apiClient.get<ApiEnvelope<SafeUser[]>>(
    `${adminBase(universityId)}/clubs/${clubId}/advisors`
  );
  return response.data.data;
};

/** Hedef aynı üniversiteden ve global `advisor` rolünde olmalı (§5.4). */
export const assignClubAdvisor = async (
  universityId: string,
  clubId: string,
  userId: string
): Promise<void> => {
  await apiClient.post(`${adminBase(universityId)}/clubs/${clubId}/advisors`, { userId });
};

export const removeClubAdvisor = async (
  universityId: string,
  clubId: string,
  userId: string
): Promise<void> => {
  await apiClient.delete(`${adminBase(universityId)}/clubs/${clubId}/advisors/${userId}`);
};
