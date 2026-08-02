import type { University } from "@/shared/types";

/**
 * Dashboard hero görsel URL'si — tenant branding.
 *
 * Backend henüz `dashboardHeroUrl` dönmüyor (C2'de yalnızca logoUrl/primaryColor var).
 * Alan eklendiğinde `GET /users/me` → `university.dashboardHeroUrl` buradan okunur.
 */
export function resolveDashboardHeroUrl(university: University | null | undefined): string | null {
  const url = university?.dashboardHeroUrl;
  if (!url || url.trim().length === 0) return null;
  return url;
}

/**
 * Dashboard hero görsel sözleşmesi (docs/architecture/FRONTEND_UNIVERSITY.md §2.1):
 * - En-boy oranı 3:1, önerilen 1920×640, maks. 500 KB
 * - Güvenli alan: metin sol %55, sağ %45 küp
 */
export const DASHBOARD_HERO_ASPECT = "3 / 1" as const;
