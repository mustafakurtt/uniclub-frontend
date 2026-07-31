import { apiClient } from "@/shared/api/client";
import type { Activity, ApiEnvelope } from "@/shared/types";

/**
 * Etkinlik yayınlama — tek giriş noktası.
 * Zamanlanmış yayın (`scheduledPublishAtLocal`) sözleşmesi oturunca buraya
 * `publishActivityScheduled` eklenecek; UI şimdilik yalnızca "şimdi yayınla" kullanır.
 */
export async function publishActivityNow(clubId: string, activityId: string): Promise<Activity> {
  const response = await apiClient.post<ApiEnvelope<Activity>>(
    `/clubs/${clubId}/activities/${activityId}/publish`
  );
  return response.data.data;
}
