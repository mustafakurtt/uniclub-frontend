import { useInfiniteQuery } from "@tanstack/react-query";
import { getAdminClubActivities } from "@/features/admin/api/clubs";
import { ACTIVITY_STATUS_LABELS } from "@/features/activities/labels";
import { getErrorMessage } from "@/shared/api/client";
import EmptyState from "@/shared/ui/EmptyState";

const PAGE_SIZE = 20;

interface Props {
  universityId: string;
  clubId: string;
  enabled: boolean;
}

export default function ActivitiesTab({ universityId, clubId, enabled }: Props) {
  const activitiesQuery = useInfiniteQuery({
    queryKey: ["admin", universityId, "clubs", clubId, "activities"],
    queryFn: ({ pageParam }) =>
      getAdminClubActivities(universityId, clubId, { limit: PAGE_SIZE, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });

  const activities = activitiesQuery.data?.pages.flatMap((p) => p.items) ?? [];

  if (activitiesQuery.isLoading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-16 w-full" />
        <div className="skeleton h-16 w-full" />
      </div>
    );
  }

  if (activitiesQuery.isError) {
    return (
      <div className="alert-error">
        {getErrorMessage(activitiesQuery.error, "Etkinlikler yüklenemedi.")}
      </div>
    );
  }

  if (activities.length === 0) {
    return <EmptyState icon="calendar" title="Bu kulüpte etkinlik yok" />;
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-slate-100">
        {activities.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">{a.title}</p>
              <p className="text-xs text-slate-500">
                {new Date(a.startsAt).toLocaleString("tr-TR")}
                {a.location ? ` · ${a.location}` : ""}
              </p>
            </div>
            <span className="chip text-[11px]">{ACTIVITY_STATUS_LABELS[a.status]}</span>
          </li>
        ))}
      </ul>
      {activitiesQuery.hasNextPage && (
        <button
          type="button"
          className="btn-ghost text-sm"
          disabled={activitiesQuery.isFetchingNextPage}
          onClick={() => activitiesQuery.fetchNextPage()}
        >
          {activitiesQuery.isFetchingNextPage ? "Yükleniyor…" : "Daha fazla göster"}
        </button>
      )}
    </div>
  );
}
