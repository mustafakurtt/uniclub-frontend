// Danışman davet yönetimi — admin (FRONTEND_YONETIM.md §5.4, FRONTEND_CLUBS.md §10)
import { apiClient } from "@/shared/api/client";
import type {
  ApiEnvelope,
  ClubAdvisorInvitation,
  InviteClubAdvisorDto,
  SafeUser,
} from "@/shared/types";
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

export const getClubAdvisorInvitations = async (
  universityId: string,
  clubId: string
): Promise<ClubAdvisorInvitation[]> => {
  const response = await apiClient.get<ApiEnvelope<ClubAdvisorInvitation[]>>(
    `${adminBase(universityId)}/clubs/${clubId}/advisor-invitations`
  );
  return response.data.data;
};

/** Davet oluşturur — kabul edilene kadar aktif danışman sayılmaz. */
export const inviteClubAdvisor = async (
  universityId: string,
  clubId: string,
  body: InviteClubAdvisorDto
): Promise<ClubAdvisorInvitation> => {
  const response = await apiClient.post<ApiEnvelope<ClubAdvisorInvitation>>(
    `${adminBase(universityId)}/clubs/${clubId}/advisors`,
    body
  );
  return response.data.data;
};

export const cancelClubAdvisorInvitation = async (
  universityId: string,
  clubId: string,
  invitationId: string
): Promise<void> => {
  await apiClient.delete(
    `${adminBase(universityId)}/clubs/${clubId}/advisor-invitations/${invitationId}`
  );
};

/** Yönetici zorla kaldırma — davet akışından bağımsız. */
export const removeClubAdvisor = async (
  universityId: string,
  clubId: string,
  userId: string
): Promise<void> => {
  await apiClient.delete(`${adminBase(universityId)}/clubs/${clubId}/advisors/${userId}`);
};
