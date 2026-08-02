import {
  publishUniversityAnnouncement,
  updateUniversityAnnouncement,
} from "@/features/university-announcements/api/universityAnnouncements";
import type { UniversityAnnouncement } from "@/shared/types";

export async function publishUniversityAnnouncementNow(
  universityId: string,
  announcementId: string,
): Promise<UniversityAnnouncement> {
  return publishUniversityAnnouncement(universityId, announcementId);
}

export async function publishUniversityAnnouncementScheduled(
  universityId: string,
  announcementId: string,
  scheduledPublishAtLocal: string,
): Promise<UniversityAnnouncement> {
  return updateUniversityAnnouncement(universityId, announcementId, {
    scheduledPublishAtLocal,
  });
}

export async function cancelUniversityAnnouncementScheduledPublish(
  universityId: string,
  announcementId: string,
): Promise<UniversityAnnouncement> {
  return updateUniversityAnnouncement(universityId, announcementId, {
    scheduledPublishAtLocal: null,
  });
}
