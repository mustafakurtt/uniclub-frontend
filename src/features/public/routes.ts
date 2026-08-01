/** Kamuya açık frontend rotaları — API yolu `/api/public/...` ile eşleşir. */
export const publicClubPath = (universitySlug: string, clubSlug: string) =>
  `/u/${universitySlug}/kulup/${clubSlug}`;

export const publicActivityPath = (universitySlug: string, activityId: string) =>
  `/u/${universitySlug}/etkinlik/${activityId}`;

export const publicQrPath = (code: string) => `/q/${encodeURIComponent(code)}`;
