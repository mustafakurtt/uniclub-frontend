// Okul geneli duyurular — /api/universities/:universityId/announcements.
import { apiClient } from "@/shared/api/client";
import type {
  ApiEnvelope,
  CreateUniversityAnnouncementDto,
  UniversityAnnouncement,
  UpdateUniversityAnnouncementDto,
} from "@/shared/types";

export const listUniversityAnnouncements = async (
  universityId: string,
): Promise<UniversityAnnouncement[]> => {
  const response = await apiClient.get<ApiEnvelope<UniversityAnnouncement[]>>(
    `/universities/${universityId}/announcements`,
  );
  return response.data.data;
};

export const createUniversityAnnouncement = async (
  universityId: string,
  dto: CreateUniversityAnnouncementDto,
): Promise<UniversityAnnouncement> => {
  const response = await apiClient.post<ApiEnvelope<UniversityAnnouncement>>(
    `/universities/${universityId}/announcements`,
    dto,
  );
  return response.data.data;
};

export const updateUniversityAnnouncement = async (
  universityId: string,
  announcementId: string,
  dto: UpdateUniversityAnnouncementDto,
): Promise<UniversityAnnouncement> => {
  const response = await apiClient.patch<ApiEnvelope<UniversityAnnouncement>>(
    `/universities/${universityId}/announcements/${announcementId}`,
    dto,
  );
  return response.data.data;
};

export const deleteUniversityAnnouncement = async (
  universityId: string,
  announcementId: string,
): Promise<void> => {
  await apiClient.delete(`/universities/${universityId}/announcements/${announcementId}`);
};

export const publishUniversityAnnouncement = async (
  universityId: string,
  announcementId: string,
): Promise<UniversityAnnouncement> => {
  const response = await apiClient.post<ApiEnvelope<UniversityAnnouncement>>(
    `/universities/${universityId}/announcements/${announcementId}/publish`,
  );
  return response.data.data;
};
