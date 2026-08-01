// Danışman davet self-service — /api/users/me (FRONTEND_CLUBS.md §10)
import { apiClient } from "@/shared/api/client";
import type {
  ApiEnvelope,
  ClubAdvisorInvitation,
  DeclineAdvisorInvitationDto,
  WithdrawAdvisorDto,
} from "@/shared/types";

export const getMyAdvisorInvitations = async (): Promise<ClubAdvisorInvitation[]> => {
  const response = await apiClient.get<ApiEnvelope<ClubAdvisorInvitation[]>>(
    "/users/me/advisor-invitations"
  );
  return response.data.data;
};

export const acceptAdvisorInvitation = async (
  invitationId: string
): Promise<{ clubId: string; invitationId: string }> => {
  const response = await apiClient.patch<
    ApiEnvelope<{ clubId: string; invitationId: string }>
  >(`/users/me/advisor-invitations/${invitationId}/accept`);
  return response.data.data;
};

export const declineAdvisorInvitation = async (
  invitationId: string,
  body: DeclineAdvisorInvitationDto
): Promise<{ invitationId: string }> => {
  const response = await apiClient.patch<ApiEnvelope<{ invitationId: string }>>(
    `/users/me/advisor-invitations/${invitationId}/decline`,
    body
  );
  return response.data.data;
};

export const withdrawFromAdvisedClub = async (
  clubId: string,
  body: WithdrawAdvisorDto
): Promise<{ clubId: string }> => {
  const response = await apiClient.post<ApiEnvelope<{ clubId: string }>>(
    `/users/me/advised-clubs/${clubId}/withdraw`,
    body
  );
  return response.data.data;
};
