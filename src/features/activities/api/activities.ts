// Activities feature — /api/activities + kulüp alt-kaynağı (docs/FRONTEND_ETKINLIKLER.md).
//
// Bölüm sırası dokümanla aynı:
//  1. Keşif + RSVP — /api/activities
//  2. Kulüp-içi listeleme — /api/clubs/:clubId/activities (keşif sayfasındaki kulüp filtresi + kulüp detay bölümü)
import { apiClient } from "@/shared/api/client";
import type {
  Activity,
  ActivityDetail,
  ActivityScope,
  ApiEnvelope,
  UserRsvpStatus,
} from "@/shared/types";

export interface ListActivitiesParams {
  scope?: ActivityScope;
  search?: string;
}

export interface RsvpActivityDto {
  status?: UserRsvpStatus;
}

// ---------------------------------------------------------------------------
// Keşif + RSVP — /api/activities (§ Keşif + RSVP)
// ---------------------------------------------------------------------------

/** GET /activities?scope=&search= — üniversite geneli yayınlanmış + university görünürlüklü. */
export const getActivities = async (params: ListActivitiesParams = {}): Promise<Activity[]> => {
  const response = await apiClient.get<ApiEnvelope<Activity[]>>("/activities", {
    params: {
      scope: params.scope ?? "upcoming",
      ...(params.search ? { search: params.search } : {}),
    },
  });
  return response.data.data;
};

/** GET /activities/:activityId — görünürlük/tenant kuralları uygulanır; yoksa 404. */
export const getActivity = async (activityId: string): Promise<ActivityDetail> => {
  const response = await apiClient.get<ApiEnvelope<ActivityDetail>>(`/activities/${activityId}`);
  return response.data.data;
};

/** POST /activities/:activityId/rsvp — upsert; varsayılan status `going`. */
export const rsvpActivity = async (
  activityId: string,
  dto: RsvpActivityDto = {}
): Promise<ActivityRsvpResponse> => {
  const response = await apiClient.post<ApiEnvelope<ActivityRsvpResponse>>(
    `/activities/${activityId}/rsvp`,
    dto
  );
  return response.data.data;
};

/** DELETE /activities/:activityId/rsvp — idempotent. */
export const cancelActivityRsvp = async (activityId: string): Promise<void> => {
  await apiClient.delete(`/activities/${activityId}/rsvp`);
};

/** RSVP yanıtı — backend `myRsvp` benzeri döner. */
export interface ActivityRsvpResponse {
  status: UserRsvpStatus;
  checkedInAt: string | null;
}

// ---------------------------------------------------------------------------
// Kulüp-içi listeleme — /api/clubs/:clubId/activities (§ Kulüp-içi etkinlik yönetimi)
// ---------------------------------------------------------------------------

/** GET /clubs/:clubId/activities — members yalnızca üyeye; taslaklar yalnızca staff'a. */
export const getClubActivities = async (clubId: string): Promise<Activity[]> => {
  const response = await apiClient.get<ApiEnvelope<Activity[]>>(`/clubs/${clubId}/activities`);
  return response.data.data;
};
