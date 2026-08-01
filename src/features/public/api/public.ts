// Kamuya açık okuma — docs/architecture/FRONTEND_KAMUYA_ACIK.md (kimlik yok).
import { apiClient } from "@/shared/api/client";
import type { ApiEnvelope, PosterQrResolveResult, PublicActivityDetail, PublicClubPage } from "@/shared/types";

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

/** Bilinmeyen kod → 404; bilinen ama pasif → 200 + status. */
export const resolvePosterQr = async (code: string): Promise<PosterQrResolveResult> => {
  const response = await apiClient.get<ApiEnvelope<PosterQrResolveResult>>(`/public/qr/${code}`);
  return response.data.data;
};
