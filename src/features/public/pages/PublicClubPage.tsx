import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getPublicClubPage } from "@/features/public/api/public";
import { useRedirectIfAuthenticated } from "@/features/public/hooks/useRedirectIfAuthenticated";
import { publicActivityPath } from "@/features/public/routes";
import PublicContactLinks from "@/features/public/components/PublicContactLinks";
import PublicNotFound from "@/features/public/components/PublicNotFound";
import { formatActivityDateTime } from "@/features/activities/formatActivityDateTime";
import { usePageMeta } from "@/shared/hooks/usePageMeta";
import PageLoader from "@/shared/ui/PageLoader";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";

export default function PublicClubPage() {
  const { universitySlug = "", clubSlug = "" } = useParams();

  const clubQuery = useQuery({
    queryKey: ["public", "club", universitySlug, clubSlug],
    queryFn: () => getPublicClubPage(universitySlug, clubSlug),
    enabled: !!universitySlug && !!clubSlug,
    retry: (count, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) return false;
      return count < 1;
    },
  });

  const club = clubQuery.data;
  useRedirectIfAuthenticated(club ? `/clubs/${club.id}` : null);

  usePageMeta({
    title: club ? `${club.name} — ${club.university.name} | UniClub` : "Kulüp | UniClub",
    description: club?.description?.slice(0, 160) ?? `${club?.name ?? "Kulüp"} — UniClub kamuya açık sayfa`,
    image: club?.coverUrl ?? club?.logoUrl,
  });

  if (clubQuery.isLoading) {
    return <PageLoader label="Kulüp yükleniyor..." />;
  }

  const isNotFound =
    clubQuery.isError &&
    axios.isAxiosError(clubQuery.error) &&
    clubQuery.error.response?.status === 404;

  if (isNotFound || !club) {
    return <PublicNotFound title="Kulüp bulunamadı" />;
  }

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="relative h-36 bg-gradient-to-br from-brand-800 to-accent-600 sm:h-44">
          {club.coverUrl && (
            <img src={club.coverUrl} alt="" className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
        </div>
        <div className="relative px-5 pb-5 sm:px-6">
          <div className="-mt-10 flex items-end gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-card ring-4 ring-white">
              {club.logoUrl ? (
                <img src={club.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-3xl font-extrabold text-gradient">
                  {club.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="pb-1">
              <p className="text-xs font-semibold text-slate-400">{club.university.name}</p>
              <h1 className="font-display text-2xl font-extrabold text-slate-900">{club.name}</h1>
            </div>
          </div>
          {club.description && (
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{club.description}</p>
          )}
        </div>
      </div>

      <PublicContactLinks links={club.contactLinks} />

      <section className="card p-5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-slate-900">
          <Icon name="calendar" size={20} className="text-brand-600" />
          Yaklaşan etkinlikler
        </h2>
        {club.upcomingActivities.length === 0 ? (
          <EmptyState icon="calendar" title="Yaklaşan etkinlik yok" />
        ) : (
          <ul className="space-y-3">
            {club.upcomingActivities.map((a) => (
              <li key={a.id}>
                <Link
                  to={publicActivityPath(universitySlug, a.id)}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/70 p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/30"
                >
                  <div className="min-w-0">
                    <h3 className="truncate font-display font-bold text-slate-900 group-hover:text-brand-700">
                      {a.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatActivityDateTime(a.startsAt)}
                      {a.location && ` · ${a.location}`}
                    </p>
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
    </div>
  );
}
