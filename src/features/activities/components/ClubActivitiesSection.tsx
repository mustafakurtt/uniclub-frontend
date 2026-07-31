import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClubActivities } from "@/features/activities/api/activities";
import { getErrorMessage } from "@/shared/api/client";
import { formatActivityDateTime } from "@/features/activities/formatActivityDateTime";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";

interface ClubActivitiesSectionProps {
  clubId: string;
}

/** Kulüp detayındaki etkinlik listesi (FRONTEND_ETKINLIKLER.md § Kulüp-içi). */
export default function ClubActivitiesSection({ clubId }: ClubActivitiesSectionProps) {
  const activitiesQuery = useQuery({
    queryKey: ["clubs", clubId, "activities"],
    queryFn: () => getClubActivities(clubId),
  });

  const activities = activitiesQuery.data ?? [];

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="icon-tile">
          <Icon name="calendar" size={24} className="text-brand-600" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Etkinlikler</h2>
          <p className="text-xs text-slate-500">Bu kulübün etkinlikleri</p>
        </div>
      </div>

      {activitiesQuery.isLoading ? (
        <div className="space-y-3">
          <div className="skeleton h-16 w-full" />
          <div className="skeleton h-16 w-full" />
        </div>
      ) : activitiesQuery.isError ? (
        <div className="alert-error">
          {getErrorMessage(activitiesQuery.error, "Etkinlikler yüklenemedi.")}
        </div>
      ) : activities.length === 0 ? (
        <EmptyState icon="calendar" title="Henüz etkinlik yok" />
      ) : (
        <ul className="space-y-3">
          {activities.map((a) => (
            <li key={a.id}>
              <Link
                to={`/activities/${a.id}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/70 p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/30"
              >
                <div className="min-w-0">
                  <h3 className="truncate font-display font-bold text-slate-900 group-hover:text-brand-700">
                    {a.title}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <Icon name="calendar" size={12} className="text-brand-500" />
                    {formatActivityDateTime(a.startsAt)}
                    {a.location && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="truncate">{a.location}</span>
                      </>
                    )}
                  </p>
                  {a.status === "cancelled" && (
                    <span className="mt-1 inline-block text-[11px] font-bold text-red-600">
                      İptal edildi
                    </span>
                  )}
                </div>
                <Icon
                  name="chevronRight"
                  size={18}
                  className="shrink-0 text-slate-300 group-hover:text-brand-600"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
