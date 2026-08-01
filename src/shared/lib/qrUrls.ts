/** Afiş QR — kamuya açık çözümleme rotası. */
export function posterQrScanUrl(code: string): string {
  return `${window.location.origin}/q/${encodeURIComponent(code)}`;
}

/** Yoklama QR — öğrenci tarama linki (token kısa ömürlü). */
export function checkInScanUrl(activityId: string, token: string): string {
  const params = new URLSearchParams({ token });
  return `${window.location.origin}/activities/${activityId}/yoklama?${params}`;
}

/** Tarama sonucundan yoklama token'ını çıkarır (ham token veya tam URL). */
export function parseCheckInToken(raw: string, activityId: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed, window.location.origin);
    const token = url.searchParams.get("token");
    if (token) return token;
    if (url.pathname.includes(`/activities/${activityId}/yoklama`)) {
      return url.searchParams.get("token");
    }
  } catch {
    // ham token
  }
  return trimmed;
}
