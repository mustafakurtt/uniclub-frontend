// Kulüp paneli — dashboard + devir teslim (FRONTEND_CLUBS.md §7.8, management.routes).
import { apiClient } from "@/shared/api/client";
import type {
  ApiEnvelope,
  ClubDashboard,
  CreateHandoverRecordDto,
  HandoverRecord,
} from "@/shared/types";

/** GET /clubs/:clubId/dashboard — kulüp staff özeti. */
export const getClubDashboard = async (clubId: string): Promise<ClubDashboard> => {
  const response = await apiClient.get<ApiEnvelope<ClubDashboard>>(`/clubs/${clubId}/dashboard`);
  return response.data.data;
};

/** GET /clubs/:clubId/handover-records */
export const listHandoverRecords = async (clubId: string): Promise<HandoverRecord[]> => {
  const response = await apiClient.get<ApiEnvelope<HandoverRecord[]>>(
    `/clubs/${clubId}/handover-records`,
  );
  return response.data.data;
};

/** GET /clubs/:clubId/handover-records/:handoverId */
export const getHandoverRecord = async (
  clubId: string,
  handoverId: string,
): Promise<HandoverRecord> => {
  const response = await apiClient.get<ApiEnvelope<HandoverRecord>>(
    `/clubs/${clubId}/handover-records/${handoverId}`,
  );
  return response.data.data;
};

/** POST /clubs/:clubId/handover-records — officer/başkan. */
export const createHandoverRecord = async (
  clubId: string,
  dto: CreateHandoverRecordDto,
): Promise<HandoverRecord> => {
  const response = await apiClient.post<ApiEnvelope<HandoverRecord>>(
    `/clubs/${clubId}/handover-records`,
    dto,
  );
  return response.data.data;
};
