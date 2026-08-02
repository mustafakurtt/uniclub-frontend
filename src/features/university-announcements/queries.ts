export const universityAnnouncementsQueryKey = (universityId: string) =>
  ["university-announcements", universityId] as const;

export const universityAnnouncementQueryKey = (universityId: string, announcementId: string) =>
  ["university-announcements", universityId, announcementId] as const;
