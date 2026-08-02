// Genel kurul — GET/POST /api/clubs/:clubId/general-meetings (FRONTEND_CLUBS.md §7.7)
import { apiClient } from "@/shared/api/client";
import type {
  ApiEnvelope,
  CreateGeneralMeetingDto,
  CurrentBoard,
  GeneralMeetingDetail,
  GeneralMeetingSummary,
} from "@/shared/types";

export const listGeneralMeetings = async (
  clubId: string
): Promise<GeneralMeetingSummary[]> => {
  const response = await apiClient.get<ApiEnvelope<GeneralMeetingSummary[]>>(
    `/clubs/${clubId}/general-meetings`
  );
  return response.data.data;
};

export const getGeneralMeeting = async (
  clubId: string,
  meetingId: string
): Promise<GeneralMeetingDetail> => {
  const response = await apiClient.get<ApiEnvelope<GeneralMeetingDetail>>(
    `/clubs/${clubId}/general-meetings/${meetingId}`
  );
  return response.data.data;
};

export const createGeneralMeeting = async (
  clubId: string,
  body: CreateGeneralMeetingDto
): Promise<GeneralMeetingDetail> => {
  const response = await apiClient.post<ApiEnvelope<GeneralMeetingDetail>>(
    `/clubs/${clubId}/general-meetings`,
    body
  );
  return response.data.data;
};

/** GET /clubs/:clubId/current-board — onaylı üye; güncel yönetim/denetleme kurulu. */
export const getCurrentBoard = async (clubId: string): Promise<CurrentBoard> => {
  const response = await apiClient.get<ApiEnvelope<CurrentBoard>>(
    `/clubs/${clubId}/current-board`,
  );
  return response.data.data;
};
