import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { formatActivityRange } from "@/features/activities/formatActivityDateTime";
import { getDiscoverActivities } from "@/features/discover/api/discover";
import { useTenantTimezone } from "@/features/auth/hooks/useTenantTimezone";
import { usePageMeta } from "@/shared/hooks/usePageMeta";
import type { DiscoverActivity } from "@/shared/types";
import Reveal from "@/shared/ui/Reveal";
import SelectField from "@/shared/ui/SelectField";
import { Icon } from "@/shared/ui/Icon";

function DiscoverCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="skeleton mb-3 h-3 w-24 rounded" />
      <div className="skeleton mb-2 h-5 w-3/4 rounded" />
      <div className="skeleton mb-4 h-3 w-full rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
    </div>
  );
}

function DiscoverActivityCard({
  activity,
  timezone,
}: {
  activity: DiscoverActivity;
  timezone: string | null;
}) {
  return (
    <article className="card p-5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-brand-600">
        {activity.university.name}
      </p>
      <h2 className="mt-1 font-display text-lg font-extrabold text-slate-900">{activity.title}</h2>
      {activity.description && (
        <p className="mt-2 line-clamp-3 text-sm text-slate-600">{activity.description}</p>
      )}
      <div className="mt-4 space-y-1.5 text-sm text-slate-500">
        <p className="flex items-center gap-2">
          <Icon name="club" size={15} className="shrink-0 text-brand-500" />
          <span className="truncate">{activity.hostClub.name}</span>
        </p>
        <p className="flex items-center gap-2">
          <Icon name="calendar" size={15} className="shrink-0 text-brand-500" />
          <span>{formatActivityRange(activity.startsAt, activity.endsAt, timezone)}</span>
        </p>
        {activity.location && (
          <p className="flex items-center gap-2">
            <Icon name="campus" size={15} className="shrink-0 text-brand-500" />
            <span className="truncate">{activity.location}</span>
          </p>
        )}
      </div>
    </article>
  );
}

function DiscoverDisabledState() {
  return (
    <div className="card-gradient animate-scale-in p-10 text-center sm:p-14">
      <Icon name="globe" size={44} className="mx-auto mb-4 text-slate-300" />
      <h2 className="font-display text-xl font-bold text-slate-800">Kurumunuz bu özelliği açmamış</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        Diğer üniversitelerdeki etkinlikleri görmek için kurumunuzun üniversiteler arası
        keşif ağına katılması gerekir. Bu ayar yöneticiler tarafından açılır.
      </p>
      <Link to="/activities" className="btn-secondary mt-6 inline-flex">
        Kendi etkinliklerine git
      </Link>
    </div>
  );
}

export default function DiscoverPage() {
  usePageMeta({
    title: "Diğer üniversiteler — UniClub",
    description: "Üniversiteler arası ağda yayınlanan yaklaşan etkinlikleri keşfet.",
  });

  const timezone = useTenantTimezone();
  const [universityFilter, setUniversityFilter] = useState("");
  const [knownUniversities, setKnownUniversities] = useState<Map<string, string>>(() => new Map());

  const discoverQuery = useInfiniteQuery({
    queryKey: ["discover", "activities", { universityId: universityFilter || null }],
    queryFn: ({ pageParam }) =>
      getDiscoverActivities({
        limit: 20,
        cursor: pageParam,
        universityId: universityFilter || null,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) return false;
      return failureCount < 1;
    },
  });

  const isFeatureDisabled =
    discoverQuery.isError &&
    axios.isAxiosError(discoverQuery.error) &&
    discoverQuery.error.response?.status === 404;

  const items = useMemo(
    () => (discoverQuery.data?.pages ?? []).flatMap((page) => page.items),
    [discoverQuery.data],
  );

  useEffect(() => {
    if (items.length === 0) return;
    setKnownUniversities((prev) => {
      const next = new Map(prev);
      for (const activity of items) {
        next.set(activity.university.id, activity.university.name);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

  const universityOptions = useMemo(
    () => [...knownUniversities.entries()].sort((a, b) => a[1].localeCompare(b[1], "tr-TR")),
    [knownUniversities],
  );

  if (discoverQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <DiscoverCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isFeatureDisabled) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <DiscoverDisabledState />
      </div>
    );
  }

  if (discoverQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="card-gradient max-w-md animate-scale-in p-10 text-center">
          <Icon name="offline" size={40} className="mx-auto mb-4 text-brand-500" />
          <p className="mb-2 font-semibold text-slate-700">Liste yüklenirken bir hata oluştu.</p>
          <button type="button" onClick={() => discoverQuery.refetch()} className="btn-primary mt-4 w-full">
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader />

      <p className="rounded-2xl border border-brand-100 bg-brand-50/80 px-4 py-3 text-sm text-brand-900">
        Kendi üniversitendeki etkinlikler burada listelenmez — onları{" "}
        <Link to="/activities" className="font-bold underline underline-offset-2">
          Etkinlikler
        </Link>{" "}
        sayfasında RSVP ile takip edebilirsin. Bu sayfa yalnızca diğer kurumlardan
        paylaşılan etkinlikleri gösterir.
      </p>

      {universityOptions.length > 1 && (
        <SelectField
          value={universityFilter}
          onChange={(e) => setUniversityFilter(e.target.value)}
          aria-label="Üniversiteye göre filtrele"
          className="h-11 max-w-sm rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-card outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
        >
          <option value="">Tüm üniversiteler</option>
          {universityOptions.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </SelectField>
      )}

      {!discoverQuery.isLoading && (
        <p className="text-xs font-bold text-slate-400">{items.length} etkinlik</p>
      )}

      {items.length === 0 ? (
        <div className="card-gradient animate-scale-in p-10 text-center sm:p-14">
          <Icon name="globe" size={48} className="mx-auto mb-4 animate-float text-brand-500" />
          <p className="mb-1 font-display text-lg font-bold text-slate-700 sm:text-xl">
            {universityFilter
              ? "Bu üniversiteden yaklaşan etkinlik yok."
              : "Henüz başka üniversitelerden etkinlik yok."}
          </p>
          <p className="text-sm text-slate-400">
            Kurumlar ağa katıldıkça burada paylaşılan etkinlikler görünür.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((activity, i) => (
              <Reveal key={activity.id} delay={Math.min(i, 5) * 60}>
                <DiscoverActivityCard activity={activity} timezone={timezone} />
              </Reveal>
            ))}
          </div>

          {discoverQuery.hasNextPage && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => discoverQuery.fetchNextPage()}
                disabled={discoverQuery.isFetchingNextPage}
                className="btn-secondary min-w-[10rem]"
              >
                {discoverQuery.isFetchingNextPage ? "Yükleniyor…" : "Daha fazla göster"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
        Diğer üniversitelerde{" "}
        <span className="text-gradient">ne oluyor?</span>
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
        Üniversiteler arası ağda paylaşılan yaklaşan etkinlikler — salt okunur vitrin.
      </p>
    </div>
  );
}
