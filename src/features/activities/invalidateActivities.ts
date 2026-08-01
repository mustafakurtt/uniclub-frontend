import type { QueryClient } from "@tanstack/react-query";

/** Etkinlik mutasyonlarından sonra kulüp listesi + keşif + detay tazelenir. */
export function invalidateActivityQueries(
  queryClient: QueryClient,
  clubId: string,
  activityId?: string
) {
  queryClient.invalidateQueries({ queryKey: ["clubs", clubId, "activities"] });
  queryClient.invalidateQueries({ queryKey: ["activities"] });
  if (activityId) {
    queryClient.invalidateQueries({ queryKey: ["activities", activityId] });
  }
}
