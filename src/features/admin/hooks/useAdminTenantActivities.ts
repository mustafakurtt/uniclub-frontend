import { useQuery } from "@tanstack/react-query";
import { getAdminClubActivities, getAdminClubs } from "@/features/admin/api";
import type { ActivityListItem } from "@/shared/types";

const PAGE_SIZE = 100;

export interface AdminTenantActivityRow {
  activity: ActivityListItem;
  listedClubId: string;
  listedClubName: string;
}

async function fetchClubActivitiesAllPages(
  universityId: string,
  clubId: string
): Promise<ActivityListItem[]> {
  const all: ActivityListItem[] = [];
  let cursor: string | undefined;
  for (;;) {
    const page = await getAdminClubActivities(universityId, clubId, {
      limit: PAGE_SIZE,
      cursor,
    });
    all.push(...page.items);
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return all;
}

async function fetchTenantActivities(universityId: string): Promise<AdminTenantActivityRow[]> {
  const clubs = await getAdminClubs(universityId);
  const byId = new Map<string, AdminTenantActivityRow>();

  await Promise.all(
    clubs.map(async (club) => {
      const activities = await fetchClubActivitiesAllPages(universityId, club.id);
      for (const activity of activities) {
        if (!byId.has(activity.id)) {
          byId.set(activity.id, {
            activity,
            listedClubId: club.id,
            listedClubName: club.name,
          });
        }
      }
    })
  );

  return Array.from(byId.values());
}

export function useAdminTenantActivities(universityId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["admin", universityId, "activities", "tenant"],
    queryFn: () => fetchTenantActivities(universityId),
    enabled,
  });
}

export type AdminActivityTab = "upcoming" | "past" | "cancelled";

export function filterAdminActivities(
  rows: AdminTenantActivityRow[],
  tab: AdminActivityTab
): AdminTenantActivityRow[] {
  const now = Date.now();
  const filtered = rows.filter(({ activity }) => {
    if (tab === "cancelled") return activity.status === "cancelled";
    if (activity.status === "cancelled") return false;
    const starts = new Date(activity.startsAt).getTime();
    if (tab === "upcoming") return starts >= now;
    return starts < now;
  });

  return filtered.sort((a, b) => {
    const at = new Date(a.activity.startsAt).getTime();
    const bt = new Date(b.activity.startsAt).getTime();
    return tab === "upcoming" ? at - bt : bt - at;
  });
}
