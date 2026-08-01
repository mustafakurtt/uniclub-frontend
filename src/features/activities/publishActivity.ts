import { updateClubActivity } from "@/features/activities/api/clubActivities";
import { apiClient } from "@/shared/api/client";
import type { Activity, ApiEnvelope } from "@/shared/types";

/**
 * Etkinlik yayınlama — tek giriş noktası.
 * Zamanlanmış yayın da PATCH üzerinden buradan gider; formlar doğrudan API'yi çağırmaz.
 */

export async function publishActivityNow(clubId: string, activityId: string): Promise<Activity> {
  const response = await apiClient.post<ApiEnvelope<Activity>>(
    `/clubs/${clubId}/activities/${activityId}/publish`
  );
  return response.data.data;
}

/**
 * Taslağa tenant yerel yayın saati ata.
 * `scheduledPublishAtLocal`: YYYY-MM-DDTHH:mm — offset yok, olduğu gibi gönderilir.
 */
export async function publishActivityScheduled(
  clubId: string,
  activityId: string,
  scheduledPublishAtLocal: string
): Promise<Activity> {
  return updateClubActivity(clubId, activityId, { scheduledPublishAtLocal });
}

/** Zamanlanmış yayını iptal et — düz taslağa döner. */
export async function cancelActivityScheduledPublish(
  clubId: string,
  activityId: string
): Promise<Activity> {
  return updateClubActivity(clubId, activityId, { scheduledPublishAtLocal: null });
}
