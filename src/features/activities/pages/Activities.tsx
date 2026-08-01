import { useMemo, useState } from "react";
import SelectField from "@/shared/ui/SelectField";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getActivities, getClubActivities } from "@/features/activities/api/activities";
import { getAvailableClubs } from "@/features/clubs/api/clubs";
import { ACTIVITY_SCOPE_LABELS } from "@/features/activities/labels";
import { formatActivityDateTime } from "@/features/activities/formatActivityDateTime";
import { useTenantTimezone } from "@/features/auth/hooks/useTenantTimezone";
import type { Activity, ActivityScope } from "@/shared/types";
import Reveal from "@/shared/ui/Reveal";
import { Icon } from "@/shared/ui/Icon";

const SCOPES: ActivityScope[] = ["upcoming", "past", "all"];

function ActivityCardSkeleton() {
  return (
    <div className="flex gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-card">
      <div className="skeleton h-20 w-20 shrink-0 rounded-2xl" />
      <div className="flex-1 space-y-2.5">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}

function ActivityCard({ activity, timezone }: { activity: Activity; timezone: string | null }) {
  const isCancelled = activity.status === "cancelled";
  const capacityLabel =
    activity.capacity == null
      ? null
      : `${activity.goingCount ?? 0} / ${activity.capacity}`;

  return (
    <Link
      to={`/activities/${activity.id}`}
      className={`card-pop group flex gap-3.5 p-4 sm:gap-4 ${isCancelled ? "opacity-70" : ""}`}
    >
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 shadow-inner-light">
        {activity.coverUrl ? (
          <img src={activity.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icon name="calendar" size={32} className="text-white/90" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="truncate font-display text-base font-extrabold text-slate-900 transition-colors group-hover:text-brand-700 sm:text-lg">
          {activity.title}
        </h2>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 sm:text-sm">
          <Icon name="calendar" size={13} className="shrink-0 text-brand-500" />
          {formatActivityDateTime(activity.startsAt, timezone)}
        </p>
        {activity.location && (
          <p className="mt-0.5 truncate text-xs text-slate-400">{activity.location}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="chip gap-1 text-[11px]">
            <Icon name="club" size={11} className="text-brand-600" />
            {activity.hostClub?.name ?? "Kulüp"}
          </span>
          {capacityLabel && (
            <span className="chip gap-1 text-[11px]">
              <Icon name="members" size={11} className="text-brand-600" />
              {capacityLabel}
            </span>
          )}
          {activity.myRsvp && (
            <span className="sticker bg-brand-600 text-[10px] text-white">
              {activity.myRsvp.status === "going" ? "Katılıyorsun" : "İlgileniyorsun"}
            </span>
          )}
          {isCancelled && (
            <span className="sticker bg-red-500 text-[10px] text-white">İptal</span>
          )}
        </div>
      </div>

      <Icon
        name="chevronRight"
        size={20}
        className="shrink-0 self-center text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-brand-600"
      />
    </Link>
  );
}

export default function Activities() {
  const timezone = useTenantTimezone();
  const [scope, setScope] = useState<ActivityScope>("upcoming");
  const [search, setSearch] = useState("");
  const [clubFilter, setClubFilter] = useState<string>("");

  const clubsQuery = useQuery({
    queryKey: ["clubs"],
    queryFn: () => getAvailableClubs(),
  });

  const activitiesQuery = useQuery({
    queryKey: ["activities", { scope, search, clubId: clubFilter || null }],
    queryFn: () =>
      clubFilter
        ? getClubActivities(clubFilter)
        : getActivities({ scope, search: search.trim() || undefined }),
  });

  const filteredActivities = useMemo(() => {
    const items = activitiesQuery.data ?? [];
    if (!clubFilter) return items;

    // Kulüp uç noktası scope'u sunucuda çözüyor; istemci tarafında ek arama/filtre.
    const q = search.trim().toLocaleLowerCase("tr-TR");
    return items.filter((a) => {
      if (scope === "upcoming" && new Date(a.startsAt) < new Date()) return false;
      if (scope === "past" && new Date(a.startsAt) >= new Date()) return false;
      if (!q) return true;
      return (
        a.title.toLocaleLowerCase("tr-TR").includes(q) ||
        (a.location ?? "").toLocaleLowerCase("tr-TR").includes(q) ||
        (a.hostClub?.name ?? "").toLocaleLowerCase("tr-TR").includes(q)
      );
    });
  }, [activitiesQuery.data, clubFilter, scope, search]);

  if (activitiesQuery.isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="card-gradient max-w-md animate-scale-in p-10 text-center">
          <Icon name="offline" size={40} className="mx-auto mb-4 text-brand-500" />
          <p className="mb-2 font-semibold text-slate-700">Etkinlikler yüklenirken bir hata oluştu.</p>
          <button onClick={() => activitiesQuery.refetch()} className="btn-primary mt-4 w-full">
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
          Etkinlikleri <span className="text-gradient">keşfet.</span>
        </h1>
      </div>

      <div className="relative">
        <Icon
          name="search"
          size={20}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Etkinlik ara..."
          aria-label="Etkinlik ara"
          className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 font-semibold text-slate-800 shadow-card outline-none transition-all duration-300 placeholder:font-normal placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="Aramayı temizle"
            className="tap absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="chip-rail">
          {SCOPES.map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              aria-pressed={scope === s}
              className="chip-filter"
            >
              {ACTIVITY_SCOPE_LABELS[s]}
            </button>
          ))}
        </div>

        <SelectField
          value={clubFilter}
          onChange={(e) => setClubFilter(e.target.value)}
          aria-label="Kulübe göre filtrele"
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-card outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
        >
          <option value="">Tüm kulüpler</option>
          {(clubsQuery.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
      </div>

      {!activitiesQuery.isLoading && (
        <p className="text-xs font-bold text-slate-400">{filteredActivities.length} etkinlik</p>
      )}

      {activitiesQuery.isLoading ? (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <ActivityCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="card-gradient animate-scale-in p-10 text-center sm:p-14">
          <Icon name="calendar" size={48} className="mx-auto mb-4 animate-float text-brand-500" />
          <p className="mb-1 font-display text-lg font-bold text-slate-700 sm:text-xl">
            {search || clubFilter || scope !== "all"
              ? "Eşleşen etkinlik bulunamadı."
              : "Henüz etkinlik yok."}
          </p>
          <p className="text-sm text-slate-400">
            {clubFilter ? "Bu kulüp için başka bir filtre dene." : "Yakında burada etkinlikler görünecek."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {filteredActivities.map((activity, i) => (
            <Reveal key={activity.id} delay={Math.min(i, 5) * 60}>
              <ActivityCard activity={activity} timezone={timezone} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
