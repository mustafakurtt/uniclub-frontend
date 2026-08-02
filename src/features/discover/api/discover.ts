// Üniversiteler arası etkinlik keşfi — GET /api/discover/activities (FRONTEND_DISCOVER.md).
import { apiClient } from "@/shared/api/client";
import type { ApiEnvelope, DiscoverActivitiesPage } from "@/shared/types";

export interface ListDiscoverActivitiesParams {
  limit?: number;
  cursor?: string | null;
  universityId?: string | null;
}

/** GET /discover/activities — çağıranın kurumu ağa katılmamışsa 404. */
export const getDiscoverActivities = async (
  params: ListDiscoverActivitiesParams = {},
): Promise<DiscoverActivitiesPage> => {
  const response = await apiClient.get<ApiEnvelope<DiscoverActivitiesPage>>("/discover/activities", {
    params: {
      limit: params.limit ?? 20,
      ...(params.cursor ? { cursor: params.cursor } : {}),
      ...(params.universityId ? { universityId: params.universityId } : {}),
    },
  });
  return response.data.data;
};
