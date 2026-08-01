// Afiş QR yönetimi — API.md §15.
import { apiClient } from "@/shared/api/client";
import type { ApiEnvelope, CreatePosterQrDto, PosterQrCode, UpdatePosterQrDto } from "@/shared/types";

// ---------------------------------------------------------------------------
// Kulüp kapsamı (host staff)
// ---------------------------------------------------------------------------

export const listClubPosterQr = async (clubId: string): Promise<PosterQrCode[]> => {
  const response = await apiClient.get<ApiEnvelope<PosterQrCode[]>>(`/clubs/${clubId}/poster-qr`);
  return response.data.data;
};

export const createClubPosterQr = async (
  clubId: string,
  dto: CreatePosterQrDto
): Promise<PosterQrCode> => {
  const response = await apiClient.post<ApiEnvelope<PosterQrCode>>(
    `/clubs/${clubId}/poster-qr`,
    dto
  );
  return response.data.data;
};

export const updateClubPosterQr = async (
  clubId: string,
  qrId: string,
  dto: UpdatePosterQrDto
): Promise<PosterQrCode> => {
  const response = await apiClient.patch<ApiEnvelope<PosterQrCode>>(
    `/clubs/${clubId}/poster-qr/${qrId}`,
    dto
  );
  return response.data.data;
};

export const cancelClubPosterQr = async (clubId: string, qrId: string): Promise<PosterQrCode> => {
  const response = await apiClient.post<ApiEnvelope<PosterQrCode>>(
    `/clubs/${clubId}/poster-qr/${qrId}/cancel`
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Üniversite kapsamı (poster_qr.university.manage)
// ---------------------------------------------------------------------------

export const listUniversityPosterQr = async (universityId: string): Promise<PosterQrCode[]> => {
  const response = await apiClient.get<ApiEnvelope<PosterQrCode[]>>(
    `/universities/${universityId}/poster-qr`
  );
  return response.data.data;
};

export const createUniversityPosterQr = async (
  universityId: string,
  dto: CreatePosterQrDto
): Promise<PosterQrCode> => {
  const response = await apiClient.post<ApiEnvelope<PosterQrCode>>(
    `/universities/${universityId}/poster-qr`,
    dto
  );
  return response.data.data;
};

export const updateUniversityPosterQr = async (
  universityId: string,
  qrId: string,
  dto: UpdatePosterQrDto
): Promise<PosterQrCode> => {
  const response = await apiClient.patch<ApiEnvelope<PosterQrCode>>(
    `/universities/${universityId}/poster-qr/${qrId}`,
    dto
  );
  return response.data.data;
};

export const cancelUniversityPosterQr = async (
  universityId: string,
  qrId: string
): Promise<PosterQrCode> => {
  const response = await apiClient.post<ApiEnvelope<PosterQrCode>>(
    `/universities/${universityId}/poster-qr/${qrId}/cancel`
  );
  return response.data.data;
};
