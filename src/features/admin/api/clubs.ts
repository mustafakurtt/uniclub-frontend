// Kulüp yönetimi — okuma `club.view`, durum/profil `club.update`, silme `club.delete` (§5.3)
import { apiClient } from "@/shared/api/client";
import type { ApiEnvelope, Club, ClubStatus, JoinPolicy } from "@/shared/types";
import { adminBase } from "./_base";

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
