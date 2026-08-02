// Etkinlikler (FRONTEND_ETKINLIKLER.md).
import type { SafeUser } from "./user";

export type ActivityStatus = "draft" | "published" | "cancelled";
export type ActivityVisibility = "university" | "members" | "inter_university";
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

export interface ActivityCoHostRow {
  clubId: string;
  status: ActivityClubStatus;
  createdAt: string;
  club: ActivityClubRef;
}

export interface ActivityAttendeeRow {
  status: RsvpStatus;
  checkedInAt: string | null;
  createdAt: string;
  user: SafeUser;
}

/** Keşif listesi satırı — hostClub kulüp listesinde dönmeyebilir. */
export interface ActivityListItem {
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
  hostClub?: ActivityClubRef;
  coHostClubs?: ActivityClubRef[];
  goingCount?: number;
  myRsvp?: ActivityRsvp | null;
  /** UTC — yalnızca zamanlanmış taslaklarda dolu. */
  scheduledPublishAt?: string | null;
}

/** @deprecated ActivityListItem kullan — geriye dönük alias */
export type Activity = ActivityListItem;

/** GET /activities/:activityId */
export interface ActivityDetail extends ActivityListItem {
  creator: SafeUser;
  hostClub: ActivityClubRef;
  coHostClubs: ActivityClubRef[];
  goingCount: number;
  myRsvp: ActivityRsvp | null;
}

export interface ActivityRsvp {
  status: RsvpStatus;
  checkedInAt: string | null;
}

/** GET /users/me/activities satırı */
export interface MyActivityRow {
  status: RsvpStatus;
  checkedInAt: string | null;
  activity: ActivityListItem & { hostClub: ActivityClubRef };
}

export type ActivityScope = "upcoming" | "past" | "all";
