// Etkinlik moderasyonu — /api/admin (activity.moderate, tenantScoped)
import { apiClient } from "@/shared/api/client";
import type { ActivityListItem, ActivityVisibility, ApiEnvelope } from "@/shared/types";
import { adminBase } from "./_base";

/** POST .../activities/:activityId/cancel — gerekçe gövdesi yok. */
export const cancelAdminActivity = async (
  universityId: string,
  activityId: string
): Promise<ActivityListItem> => {
  const response = await apiClient.post<ApiEnvelope<ActivityListItem>>(
    `${adminBase(universityId)}/activities/${activityId}/cancel`
  );
  return response.data.data;
};

/** PATCH .../clubs/:clubId/activities/:activityId — :clubId host kulüp olmalı. */
export const updateAdminActivityVisibility = async (
  universityId: string,
  hostClubId: string,
  activityId: string,
  visibility: ActivityVisibility
): Promise<ActivityListItem> => {
  const response = await apiClient.patch<ApiEnvelope<ActivityListItem>>(
    `${adminBase(universityId)}/clubs/${hostClubId}/activities/${activityId}`,
    { visibility }
  );
  return response.data.data;
};
