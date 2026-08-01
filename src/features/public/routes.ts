/** Kamuya açık frontend rotaları — QR/afiş paylaşım linkleri. */

export function publicClubPath(universitySlug: string, clubSlug: string): string {
  return `/u/${universitySlug}/kulup/${clubSlug}`;
}

export function publicActivityPath(universitySlug: string, activityId: string): string {
  return `/u/${universitySlug}/etkinlik/${activityId}`;
}
