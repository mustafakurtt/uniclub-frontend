// Kamuya açık okuma — /api/public (FRONTEND_KAMUYA_ACIK.md). Auth gerekmez.
import { apiClient } from "@/shared/api/client";
import type { ApiEnvelope, PublicActivityDetail, PublicClubPage } from "@/shared/types";

export const getPublicClubPage = async (
  universitySlug: string,
  clubSlug: string
): Promise<PublicClubPage> => {
  const response = await apiClient.get<ApiEnvelope<PublicClubPage>>(
    `/public/universities/${universitySlug}/clubs/${clubSlug}`
  );
  return response.data.data;
};

export const getPublicActivity = async (
  universitySlug: string,
  activityId: string
): Promise<PublicActivityDetail> => {
  const response = await apiClient.get<ApiEnvelope<PublicActivityDetail>>(
    `/public/universities/${universitySlug}/activities/${activityId}`
  );
  return response.data.data;
};
