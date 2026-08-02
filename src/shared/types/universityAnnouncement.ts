// Okul geneli duyurular — GET/POST /api/universities/:universityId/announcements.
import type { SafeUser } from "./user";

export type UniversityAnnouncementStatus = "draft" | "published";

export interface UniversityAnnouncement {
  id: string;
  universityId: string;
  clubId: string | null;
  title: string;
  content: string;
  authorId: string;
  status: UniversityAnnouncementStatus;
  publishedAt: string | null;
  pinned: boolean;
  createdAt: string;
  author?: SafeUser;
  /** UTC — yalnızca zamanlanmış taslaklarda dolu. */
  scheduledPublishAt?: string | null;
  /** İçerik düzenlendiyse UTC ISO — taslakta null kalır. */
  editedAt?: string | null;
}

export interface CreateUniversityAnnouncementDto {
  title: string;
  content: string;
  pinned?: boolean;
  publish?: boolean;
  /** Tenant yerel saat YYYY-MM-DDTHH:mm — offset yok. */
  scheduledPublishAtLocal?: string;
}

export interface UpdateUniversityAnnouncementDto {
  title?: string;
  content?: string;
  pinned?: boolean;
  scheduledPublishAtLocal?: string | null;
}
