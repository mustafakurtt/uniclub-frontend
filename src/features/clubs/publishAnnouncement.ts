import { updateAnnouncement } from "@/features/clubs/api/clubs";
import { apiClient } from "@/shared/api/client";
import type { Announcement, ApiEnvelope } from "@/shared/types";

/** Duyuru yayınlama — tek giriş noktası (etkinlik publishActivity.ts ile paralel). */

export async function publishAnnouncementNow(
  clubId: string,
  announcementId: string
): Promise<Announcement> {
  const response = await apiClient.post<ApiEnvelope<Announcement>>(
    `/clubs/${clubId}/announcements/${announcementId}/publish`
  );
  return response.data.data;
}

export async function publishAnnouncementScheduled(
  clubId: string,
  announcementId: string,
  scheduledPublishAtLocal: string
): Promise<Announcement> {
  return updateAnnouncement(clubId, announcementId, { scheduledPublishAtLocal });
}

export async function cancelAnnouncementScheduledPublish(
  clubId: string,
  announcementId: string
): Promise<Announcement> {
  return updateAnnouncement(clubId, announcementId, { scheduledPublishAtLocal: null });
}
