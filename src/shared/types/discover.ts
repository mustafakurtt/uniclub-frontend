// Üniversiteler arası keşif — GET /api/discover/activities (FRONTEND_DISCOVER.md).
// Yanıtta yalnızca özet alanlar; kişisel veri / RSVP / kapasite yok.

export interface DiscoverUniversityRef {
  id: string;
  name: string;
}

export interface DiscoverHostClubRef {
  name: string;
}

export interface DiscoverActivity {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  hostClub: DiscoverHostClubRef;
  university: DiscoverUniversityRef;
}

export interface DiscoverActivitiesPage {
  items: DiscoverActivity[];
  nextCursor: string | null;
}
