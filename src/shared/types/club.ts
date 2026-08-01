// Kulüp ve alt-kaynakları (FRONTEND_CLUBS.md §4–§10).
// Katman B — kulüp içi rol; her kulüpte ayrı, global rolden bağımsızdır (§3.1).
import type { SafeUser } from "./user";
import type {
  ApplicationStatus,
  ClubApplicationApproval,
  ClubApplicationRevisionRequest,
} from "./clubApplication";

export type {
  ApplicationStatus,
  ApplicationApprovalStatus,
  ClubApplicationApproval,
  ClubApplicationEvent,
  ClubApplicationEventType,
  ClubApplicationHistory,
  ClubApplicationRevisionRequest,
} from "./clubApplication";

export type ClubStatus = "pending" | "approved" | "rejected" | "archived";
export type JoinPolicy = "open" | "approval_required";
export type MembershipStatus = "pending" | "approved" | "rejected";
export type ClubRole = "member" | "officer" | "president";
export type ContactPlatform =
  | "whatsapp"
  | "instagram"
  | "discord"
  | "telegram"
  | "twitter"
  | "website"
  | "email"
  | "other";

// --- Kulüp (§4–§5) — clubs tablosu satırı ---------------------------------

export interface Club {
  id: string;
  universityId: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  status: ClubStatus;
  joinPolicy: JoinPolicy;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** GET /admin/.../clubs/:clubId → başlık sayaçları (M2.5 §5.6). */
export interface AdminClubCounts {
  members: number;
  pendingJoinRequests: number;
  upcomingActivities: number;
  advisors: number;
}

export interface AdminClubDetail extends Club {
  counts: AdminClubCounts;
}

export interface ContactLink {
  id: string;
  clubId: string;
  platform: ContactPlatform;
  url: string;
}

/** GET /clubs/:clubId/members satırı ve detaydaki clubMembers[] — gömülü user ile */
export interface ClubMemberRow {
  clubId: string;
  userId: string;
  role: ClubRole;
  status: MembershipStatus;
  joinedAt?: string;
  user: SafeUser;
}

/** GET /clubs/:clubId — kulüp + danışmanlar + onaylı üyeler + iletişim linkleri (§5.1) */
export interface ClubDetail extends Club {
  advisors: SafeUser[];
  clubMembers: ClubMemberRow[];
  contactLinks: ContactLink[];
}

// --- Alt-kaynaklar: duyurular ve galeri (§9) -------------------------------

export type AnnouncementStatus = "draft" | "published";
export type AnnouncementVisibility = "university" | "members";

export interface Announcement {
  id: string;
  clubId: string;
  title: string;
  content: string;
  authorId: string;
  status: AnnouncementStatus;
  publishedAt: string | null;
  pinned: boolean;
  visibility: AnnouncementVisibility;
  createdAt: string;
  author?: SafeUser;
  /** UTC — yalnızca zamanlanmış taslaklarda dolu. */
  scheduledPublishAt?: string | null;
}

export interface GalleryImage {
  id: string;
  clubId: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
}

// --- Üyelik ve danışmanlık (doküman §5.4, §10) -----------------------------

export interface ClubSummary {
  id: string;
  name: string;
  slug: string;
  status: ClubStatus;
  joinPolicy: JoinPolicy;
}

export interface ClubMembership {
  clubId: string;
  userId: string;
  role: ClubRole;
  /** DİKKAT: pending satırlar da gelir — yetki kararında `approved` şart (§5.4) */
  status: MembershipStatus;
  createdAt: string;
  updatedAt: string;
  club: ClubSummary;
}

/** GET /users/me/advised-clubs satırı — clubAdvisors kaydı, gömülü club ile
 *  (FRONTEND_CLUBS.md §10). Danışman kulübün ÜYESİ değildir; clubMembers'ta görünmez. */
export interface AdvisedClub {
  clubId: string;
  userId: string;
  club: ClubSummary;
}

// --- Kulüp kurma başvurusu (§6) --------------------------------------------

export interface ClubApplication {
  id: string;
  universityId: string;
  proposedName: string;
  description: string | null;
  applicantId: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

/** GET /clubs/applications/:applicationId — başvuru + onay adımları + revizyon talebi */
export interface ClubApplicationDetail extends ClubApplication {
  approvals: ClubApplicationApproval[];
  revisionRequest?: ClubApplicationRevisionRequest | null;
}
