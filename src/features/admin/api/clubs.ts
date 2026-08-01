// Kulüp yönetimi — okuma `club.view`, durum/profil `club.update`, silme `club.delete` (§5.3)
import { apiClient } from "@/shared/api/client";
import type {
  ActivityListItem,
  AdminClubDetail,
  Announcement,
  ApiEnvelope,
  Club,
  ClubStatus,
  GalleryImage,
  JoinPolicy,
  KeysetPage,
} from "@/shared/types";
import { adminBase } from "./_base";

export interface AdminClubListParams {
  limit?: number;
  cursor?: string;
}

export interface AdminUpdateClubDto {
  // En az bir alan; durum ayrı uçtan yönetilir.
  name?: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  joinPolicy?: JoinPolicy;
}

export const getAdminClubs = async (
  universityId: string,
  status?: ClubStatus
): Promise<Club[]> => {
  const response = await apiClient.get<ApiEnvelope<Club[]>>(`${adminBase(universityId)}/clubs`, {
    params: status ? { status } : undefined,
  });
  return response.data.data;
};

/** Kulüp detayı + özet sayaçlar (M2.5 §5.6). */
export const getAdminClub = async (
  universityId: string,
  clubId: string
): Promise<AdminClubDetail> => {
  const response = await apiClient.get<ApiEnvelope<AdminClubDetail>>(
    `${adminBase(universityId)}/clubs/${clubId}`
  );
  return response.data.data;
};

export const getAdminClubActivities = async (
  universityId: string,
  clubId: string,
  params?: AdminClubListParams
): Promise<KeysetPage<ActivityListItem>> => {
  const response = await apiClient.get<ApiEnvelope<KeysetPage<ActivityListItem>>>(
    `${adminBase(universityId)}/clubs/${clubId}/activities`,
    { params }
  );
  return response.data.data;
};

export const getAdminClubAnnouncements = async (
  universityId: string,
  clubId: string,
  params?: AdminClubListParams
): Promise<KeysetPage<Announcement>> => {
  const response = await apiClient.get<ApiEnvelope<KeysetPage<Announcement>>>(
    `${adminBase(universityId)}/clubs/${clubId}/announcements`,
    { params }
  );
  return response.data.data;
};

export const getAdminClubGallery = async (
  universityId: string,
  clubId: string,
  params?: AdminClubListParams
): Promise<KeysetPage<GalleryImage>> => {
  const response = await apiClient.get<ApiEnvelope<KeysetPage<GalleryImage>>>(
    `${adminBase(universityId)}/clubs/${clubId}/gallery`,
    { params }
  );
  return response.data.data;
};

export const updateClubStatus = async (
  universityId: string,
  clubId: string,
  status: ClubStatus
): Promise<Club> => {
  const response = await apiClient.patch<ApiEnvelope<Club>>(
    `${adminBase(universityId)}/clubs/${clubId}/status`,
    { status }
  );
  return response.data.data;
};

export const adminUpdateClub = async (
  universityId: string,
  clubId: string,
  dto: AdminUpdateClubDto
): Promise<Club> => {
  const response = await apiClient.patch<ApiEnvelope<Club>>(
    `${adminBase(universityId)}/clubs/${clubId}`,
    dto
  );
  return response.data.data;
};

/** Kalıcı silme (yıkıcı, cascade): yalnızca archived/rejected kulüp (§11). */
export const deleteAdminClub = async (universityId: string, clubId: string): Promise<void> => {
  await apiClient.delete(`${adminBase(universityId)}/clubs/${clubId}`);
};
