import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getPublicActivity } from "@/features/public/api/public";
import { useRedirectIfAuthenticated } from "@/features/public/hooks/useRedirectIfAuthenticated";
import { publicClubPath } from "@/features/public/routes";
import PublicJoinCta from "@/features/public/components/PublicJoinCta";
import PublicNotFound from "@/features/public/components/PublicNotFound";
import { formatActivityRange } from "@/features/activities/formatActivityDateTime";
import { usePageMeta } from "@/shared/hooks/usePageMeta";
import PageLoader from "@/shared/ui/PageLoader";
import { Icon } from "@/shared/ui/Icon";

export default function PublicActivityPage() {
  const { universitySlug = "", activityId = "" } = useParams();

  const activityQuery = useQuery({
    queryKey: ["public", "activity", universitySlug, activityId],
    queryFn: () => getPublicActivity(universitySlug, activityId),
    enabled: !!universitySlug && !!activityId,
    retry: (count, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) return false;
      return count < 1;
    },
  });

  const activity = activityQuery.data;
  useRedirectIfAuthenticated(activity ? `/activities/${activity.id}` : null);

  usePageMeta({
    title: activity ? `${activity.title} | UniClub` : "Etkinlik | UniClub",
    description:
      activity?.description?.slice(0, 160) ??
      [activity?.title, activity?.location].filter(Boolean).join(" — "),
    image: activity?.coverUrl,
  });

  if (activityQuery.isLoading) {
    return <PageLoader label="Etkinlik yükleniyor..." />;
  }

  const isNotFound =
    activityQuery.isError &&
    axios.isAxiosError(activityQuery.error) &&
    activityQuery.error.response?.status === 404;

  if (isNotFound || !activity) {
    return <PublicNotFound title="Etkinlik bulunamadı" />;
  }

  const capacityLabel =
    activity.capacity == null ? "Sınırsız kontenjan" : `${activity.capacity} kişi`;

  return (
    <div className="space-y-6">
      <article className="card overflow-hidden">
        {activity.coverUrl && (
          <div className="h-44 sm:h-52">
            <img src={activity.coverUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="p-5 sm:p-6">
          <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {activity.title}
          </h1>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Tarih ve saat
              </dt>
              <dd className="mt-1 flex items-start gap-2 text-sm font-semibold text-slate-800">
                <Icon name="calendar" size={15} className="mt-0.5 shrink-0 text-brand-600" />
                {formatActivityRange(activity.startsAt, activity.endsAt)}
              </dd>
            </div>
            {activity.location && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Konum
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">{activity.location}</dd>
              </div>
            )}
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Kontenjan
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Icon name="members" size={15} className="text-brand-600" />
                {capacityLabel}
              </dd>
            </div>
          </dl>

          {activity.description && (
            <div className="mt-5">
              <h2 className="mb-2 font-display text-sm font-bold text-slate-900">Açıklama</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {activity.description}
              </p>
            </div>
          )}

          <div className="mt-5">
            <h2 className="mb-2 font-display text-sm font-bold text-slate-900">Düzenleyen kulüpler</h2>
            <div className="flex flex-wrap gap-2">
              <Link
                to={publicClubPath(universitySlug, activity.hostClub.slug)}
                className="chip gap-1.5 transition-colors hover:bg-brand-50"
              >
                <Icon name="club" size={13} className="text-brand-600" />
                {activity.hostClub.name}
                <span className="text-[10px] text-slate-400">(host)</span>
              </Link>
              {activity.coHostClubs.map((c) => (
                <Link
                  key={c.id}
                  to={publicClubPath(universitySlug, c.slug)}
                  className="chip gap-1.5 transition-colors hover:bg-brand-50"
                >
                  <Icon name="handshake" size={13} className="text-brand-600" />
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </article>

      <PublicJoinCta />
    </div>
  );
}
