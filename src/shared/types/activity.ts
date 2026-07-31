// Etkinlikler (FRONTEND_ETKINLIKLER.md).
import type { SafeUser } from "./user";

export type ActivityStatus = "draft" | "published" | "cancelled";
export type ActivityVisibility = "university" | "members";
export type ActivityClubRole = "host" | "co_host";
export type ActivityClubStatus = "invited" | "accepted";
/** Kullanıcının seçebildiği RSVP durumları — `waitlist` şema düzeyinde var, v1'de UI yok. */
export type UserRsvpStatus = "going" | "interested";
export type RsvpStatus = UserRsvpStatus | "waitlist";

export interface ActivityClubRef {
  id: string;
  name: string;
  universityId: string;
  slug?: string;
  logoUrl?: string | null;
}

export interface ActivityRsvp {
  status: RsvpStatus;
  checkedInAt: string | null;
}

/** Keşif listesi ve kulüp listesi satırı */
export interface Activity {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  coverUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  capacity: number | null;
  status: ActivityStatus;
  visibility: ActivityVisibility;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  hostClub: ActivityClubRef;
  coHostClubs?: ActivityClubRef[];
  goingCount?: number;
  myRsvp?: ActivityRsvp | null;
}

/** GET /activities/:activityId */
export interface ActivityDetail extends Activity {
  creator: SafeUser;
  coHostClubs: ActivityClubRef[];
  goingCount: number;
  myRsvp: ActivityRsvp | null;
}

/** GET /users/me/activities satırı */
export interface MyActivityRow {
  status: RsvpStatus;
  checkedInAt: string | null;
  activity: Activity & { hostClub: ActivityClubRef };
}

export type ActivityScope = "upcoming" | "past" | "all";
