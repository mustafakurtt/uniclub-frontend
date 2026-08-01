import { useQueries, useQuery } from "@tanstack/react-query";
import { getGeneralMeeting, listGeneralMeetings } from "@/features/clubs/api/generalMeetings";
import type { GeneralMeetingBoardMember } from "@/shared/types";

/** Aktif kurul üyeleri — tüm toplantı detaylarından `endedAt === null` olanlar birleştirilir. */
export function useActiveBoardMembers(clubId: string, enabled: boolean) {
  const listQuery = useQuery({
    queryKey: ["clubs", clubId, "general-meetings"],
    queryFn: () => listGeneralMeetings(clubId),
    enabled: enabled && !!clubId,
  });

  const meetings = listQuery.data ?? [];

  const detailQueries = useQueries({
    queries: meetings.map((m) => ({
      queryKey: ["clubs", clubId, "general-meetings", m.id],
      queryFn: () => getGeneralMeeting(clubId, m.id),
      enabled: enabled && !!clubId,
    })),
  });

  const isLoading = listQuery.isLoading || detailQueries.some((q) => q.isLoading);

  const activeMembers: GeneralMeetingBoardMember[] = [];
  const seen = new Set<string>();

  for (const q of detailQueries) {
    for (const bm of q.data?.boardMembers ?? []) {
      if (bm.endedAt) continue;
      const key = `${bm.boardType}:${bm.seatType}:${bm.userId}:${bm.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      activeMembers.push(bm);
    }
  }

  return { activeMembers, isLoading, hasMeetings: meetings.length > 0 };
}
