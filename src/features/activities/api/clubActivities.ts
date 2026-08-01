// Kulüp-içi etkinlik yönetimi — /api/clubs/:clubId/activities (FRONTEND_ETKINLIKLER.md § Kulüp-içi).
import { apiClient } from "@/shared/api/client";
import type {
  Activity,
  ActivityCoHostRow,
  ActivityAttendeeRow,
  ActivityVisibility,
  ApiEnvelope,
} from "@/shared/types";

export interface CreateClubActivityDto {
  title: string;
  description?: string;
  location?: string;
  coverUrl?: string;
  startsAt: string;
  endsAt?: string;
  capacity?: number;
  visibility?: ActivityVisibility;
  /** false → taslak; true → anında yayınla. scheduledPublishAtLocal varsa yok sayılır. */
  publish?: boolean;
  /** Tenant yerel YYYY-MM-DDTHH:mm — offset yok, olduğu gibi gönderilir. */
  scheduledPublishAtLocal?: string;
}

export interface UpdateClubActivityDto {
  title?: string;
  description?: string;
  location?: string;
  coverUrl?: string;
  startsAt?: string;
  endsAt?: string | null;
  capacity?: number | null;
  visibility?: ActivityVisibility;
  scheduledPublishAtLocal?: string | null;
}

// ---------------------------------------------------------------------------
// CRUD + yaşam döngüsü
// ---------------------------------------------------------------------------

export const createClubActivity = async (
  clubId: string,
  dto: CreateClubActivityDto
): Promise<Activity> => {
  const response = await apiClient.post<ApiEnvelope<Activity>>(`/clubs/${clubId}/activities`, dto);
  return response.data.data;
};

export const updateClubActivity = async (
  clubId: string,
  activityId: string,
  dto: UpdateClubActivityDto
): Promise<Activity> => {
  const response = await apiClient.patch<ApiEnvelope<Activity>>(
    `/clubs/${clubId}/activities/${activityId}`,
    dto
  );
  return response.data.data;
};

export const cancelClubActivity = async (clubId: string, activityId: string): Promise<Activity> => {
  const response = await apiClient.post<ApiEnvelope<Activity>>(
    `/clubs/${clubId}/activities/${activityId}/cancel`
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Katılımcılar
// ---------------------------------------------------------------------------

export const getActivityAttendees = async (
  clubId: string,
  activityId: string
): Promise<ActivityAttendeeRow[]> => {
  const response = await apiClient.get<ApiEnvelope<ActivityAttendeeRow[]>>(
    `/clubs/${clubId}/activities/${activityId}/attendees`
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Co-host
// ---------------------------------------------------------------------------

export const getActivityCoHosts = async (
  clubId: string,
  activityId: string
): Promise<ActivityCoHostRow[]> => {
  const response = await apiClient.get<ApiEnvelope<ActivityCoHostRow[]>>(
    `/clubs/${clubId}/activities/${activityId}/co-hosts`
  );
  return response.data.data;
};

export const inviteActivityCoHost = async (
  hostClubId: string,
  activityId: string,
  targetClubId: string
): Promise<ActivityCoHostRow> => {
  const response = await apiClient.post<ApiEnvelope<ActivityCoHostRow>>(
    `/clubs/${hostClubId}/activities/${activityId}/co-hosts`,
    { clubId: targetClubId }
  );
  return response.data.data;
};

export const removeActivityCoHost = async (
  hostClubId: string,
  activityId: string,
  coClubId: string
): Promise<void> => {
  await apiClient.delete(`/clubs/${hostClubId}/activities/${activityId}/co-hosts/${coClubId}`);
};

export const acceptActivityCoHostInvite = async (
  coHostClubId: string,
  activityId: string
): Promise<ActivityCoHostRow> => {
  const response = await apiClient.post<ApiEnvelope<ActivityCoHostRow>>(
    `/clubs/${coHostClubId}/activities/${activityId}/co-host/accept`
  );
  return response.data.data;
};

export const declineActivityCoHostInvite = async (
  coHostClubId: string,
  activityId: string
): Promise<void> => {
  await apiClient.delete(`/clubs/${coHostClubId}/activities/${activityId}/co-host`);
};

// ---------------------------------------------------------------------------
// Yoklama QR (host staff ekranı)
// ---------------------------------------------------------------------------

export interface CheckInQrPayload {
  token: string;
  expiresAt: string;
}

/** GET /clubs/:clubId/activities/:activityId/check-in-qr — ~30s ömürlü token. */
export const getCheckInQr = async (
  clubId: string,
  activityId: string
): Promise<CheckInQrPayload> => {
  const response = await apiClient.get<ApiEnvelope<CheckInQrPayload>>(
    `/clubs/${clubId}/activities/${activityId}/check-in-qr`
  );
  return response.data.data;
};
