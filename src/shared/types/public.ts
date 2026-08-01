// Kamuya açık okuma DTO'ları (FRONTEND_KAMUYA_ACIK.md) — kişisel veri içermez.

export interface PublicClubRef {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface PublicUniversityRef {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface PublicContactLink {
  id: string;
  platform: string;
  url: string;
}

export interface PublicActivitySummary {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  coverUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  hostClub: PublicClubRef;
}

export interface PublicClubPage {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  university: PublicUniversityRef;
  contactLinks: PublicContactLink[];
  upcomingActivities: PublicActivitySummary[];
}

export interface PublicActivityDetail {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  coverUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  capacity: number | null;
  hostClub: PublicClubRef;
  coHostClubs: PublicClubRef[];
}
