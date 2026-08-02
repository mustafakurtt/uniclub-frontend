// Kampüs akışı — GET /api/feed (backend: docs/integration/dashboard.md).
//
// Bearer ister; kapsam JWT'deki üniversite ve kullanıcının onaylı kulüp
// üyelikleridir (path'te universityId yok). İmleç opak — son öğenin
// (at, kind, id) üçlüsünü taşır, istemci yorumlamaz.
import { apiClient } from "@/shared/api/client";
import type { ApiEnvelope, FeedPage } from "@/shared/types";

export const getFeed = async (params?: {
  limit?: number;
  cursor?: string | null;
}): Promise<FeedPage> => {
  const response = await apiClient.get<ApiEnvelope<FeedPage>>("/feed", {
    params: {
      ...(params?.limit ? { limit: params.limit } : {}),
      ...(params?.cursor ? { cursor: params.cursor } : {}),
    },
  });
  return response.data.data;
};
