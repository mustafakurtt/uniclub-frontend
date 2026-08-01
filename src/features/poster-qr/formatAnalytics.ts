import { formatActivityDate } from "@/features/activities/formatActivityDateTime";
import { formatTimezoneShortLabel } from "@/shared/lib/tenantLocalDatetime";

/** Tenant takvim günü (YYYY-MM-DD) — backend gruplamasıyla aynı. */
export function formatAnalyticsDay(day: string, timezone: string): string {
  const [year, month, date] = day.split("-").map(Number);
  const anchor = new Date(Date.UTC(year, month - 1, date, 12, 0, 0));
  return formatActivityDate(anchor.toISOString(), timezone);
}

/** Saat kovası (0–23, tenant TZ). */
export function formatAnalyticsHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function analyticsTimezoneLabel(timezone: string): string {
  return formatTimezoneShortLabel(timezone, "tr-TR");
}
