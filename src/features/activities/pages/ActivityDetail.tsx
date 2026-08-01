import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cancelActivityRsvp,
  getActivity,
  rsvpActivity,
} from "@/features/activities/api/activities";
import { getErrorMessage } from "@/shared/api/client";
import {
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_VISIBILITY_LABELS,
  RSVP_STATUS_ICONS,
  RSVP_STATUS_LABELS,
} from "@/features/activities/labels";
import { formatActivityRange } from "@/features/activities/formatActivityDateTime";
import { useTenantTimezone } from "@/features/auth/hooks/useTenantTimezone";
import type { UserRsvpStatus } from "@/shared/types";
import PageLoader from "@/shared/ui/PageLoader";
import Reveal from "@/shared/ui/Reveal";
import { Icon } from "@/shared/ui/Icon";
import axios from "axios";

/**
 * Etkinlik detayı + RSVP (FRONTEND_ETKINLIKLER.md § Keşif + RSVP).
 * 404 → "bulunamadı" ekranı (tenant dışı / members / taslak dahil).
 */
export default function ActivityDetail() {
  const { activityId = "" } = useParams();
  const queryClient = useQueryClient();
  const timezone = useTenantTimezone();

  const activityQuery = useQuery({
    queryKey: ["activities", activityId],
    queryFn: () => getActivity(activityId),
    enabled: !!activityId,
    retry: (count, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) return false;
      return count < 2;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["activities", activityId] });
    queryClient.invalidateQueries({ queryKey: ["activities"] });
  };

  const rsvpMutation = useMutation({
    mutationFn: (status: UserRsvpStatus) => rsvpActivity(activityId, { status }),
    onSuccess: invalidate,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelActivityRsvp(activityId),
    onSuccess: invalidate,
  });

  if (activityQuery.isLoading) {
    return <PageLoader label="Etkinlik yükleniyor..." />;
  }

  const isNotFound =
    activityQuery.isError &&
    axios.isAxiosError(activityQuery.error) &&
    activityQuery.error.response?.status === 404;

  if (isNotFound || (!activityQuery.data && activityQuery.isError)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="card-gradient max-w-md animate-scale-in p-10 text-center">
          <Icon name="notFound" size={40} className="mx-auto mb-4 text-brand-500" />
          <p className="mb-2 font-semibold text-slate-700">Etkinlik bulunamadı.</p>
          <p className="mb-6 text-sm text-slate-400">
            Bu etkinlik mevcut değil, iptal edilmiş veya görüntüleme yetkiniz olmayabilir.
          </p>
          <Link to="/activities" className="btn-primary inline-flex">
            <Icon name="arrowLeft" size={16} /> Etkinliklere Dön
          </Link>
        </div>
      </div>
    );
  }

  if (!activityQuery.data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="card-gradient max-w-md p-10 text-center">
          <p className="mb-4 font-semibold text-slate-700">
            {getErrorMessage(activityQuery.error, "Etkinlik yüklenemedi.")}
          </p>
          <button onClick={() => activityQuery.refetch()} className="btn-primary">
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  const activity = activityQuery.data;
  const isCancelled = activity.status === "cancelled";
  const isPast = new Date(activity.startsAt) < new Date();
  const capacityFull =
    activity.capacity != null && activity.goingCount >= activity.capacity;
  const myRsvp = activity.myRsvp?.status;
  const canRsvp = !isCancelled && !isPast;
  const rsvpPending = rsvpMutation.isPending || cancelMutation.isPending;
  const rsvpError = rsvpMutation.error ?? cancelMutation.error;

  const handleRsvp = (status: UserRsvpStatus) => {
    if (myRsvp === status) return;
    rsvpMutation.mutate(status);
  };

  return (
    <div className="space-y-8">
      <Link
        to="/activities"
        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-700"
      >
        <Icon name="arrowLeft" size={16} /> Etkinlikler
      </Link>

      <Reveal>
        <div className="card overflow-hidden">
          <div className="relative h-44 bg-gradient-to-br from-brand-800 to-accent-600 md:h-56">
            {activity.coverUrl && (
              <img src={activity.coverUrl} alt="" className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-grid-fine-dark bg-grid-sm opacity-30" aria-hidden />
            <div
              className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/70 to-transparent"
              aria-hidden
            />
          </div>

          <div className="relative px-6 pb-6 md:px-10">
            <div className="-mt-8">
              <h1 className="font-display text-2xl font-extrabold text-slate-900 md:text-3xl">
                {activity.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {isCancelled && (
                  <span className="chip bg-red-50 text-red-700">
                    {ACTIVITY_STATUS_LABELS.cancelled}
                  </span>
                )}
                <span className="chip gap-1.5">
                  <Icon name="policyOpen" size={13} className="text-brand-600" />
                  {ACTIVITY_VISIBILITY_LABELS[activity.visibility]}
                </span>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Tarih ve saat
                </dt>
                <dd className="mt-1 flex items-start gap-2 text-sm font-semibold text-slate-800">
                  <Icon name="calendar" size={16} className="mt-0.5 shrink-0 text-brand-600" />
                  {formatActivityRange(activity.startsAt, activity.endsAt, timezone)}
                </dd>
              </div>

              {activity.location && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Konum
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">{activity.location}</dd>
                </div>
              )}

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Katılımcılar
                </dt>
                <dd className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Icon name="members" size={16} className="text-brand-600" />
                  {activity.capacity == null
                    ? `${activity.goingCount} katılımcı`
                    : `${activity.goingCount} / ${activity.capacity}`}
                  {capacityFull && !isCancelled && (
                    <span className="text-xs font-bold text-amber-600">(Dolu)</span>
                  )}
                </dd>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Düzenleyen
                </dt>
                <dd className="mt-1">
                  <Link
                    to={`/clubs/${activity.hostClub.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
                  >
                    <Icon name="club" size={14} />
                    {activity.hostClub.name}
                  </Link>
                </dd>
              </div>
            </dl>

            {activity.coHostClubs.length > 0 && (
              <div className="mt-5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Ortak düzenleyenler
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {activity.coHostClubs.map((club) => (
                    <Link
                      key={club.id}
                      to={`/clubs/${club.id}`}
                      className="chip gap-1.5 hover:bg-brand-50"
                    >
                      <Icon name="handshake" size={13} className="text-brand-600" />
                      {club.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {activity.description && (
              <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {activity.description}
              </p>
            )}

            {canRsvp && (
              <div className="mt-8 rounded-2xl border border-slate-100 bg-white/80 p-5">
                <h2 className="font-display text-sm font-bold text-slate-900">Katılım</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["going", "interested"] as const).map((status) => {
                    const isActive = myRsvp === status;
                    const goingDisabled = status === "going" && capacityFull && !isActive;
                    return (
                      <button
                        key={status}
                        type="button"
                        disabled={rsvpPending || goingDisabled}
                        title={goingDisabled ? "Kontenjan dolu" : undefined}
                        onClick={() => handleRsvp(status)}
                        className={`btn-secondary text-xs gap-1.5 ${
                          isActive ? "ring-2 ring-brand-500 ring-offset-1" : ""
                        }`}
                      >
                        <Icon name={RSVP_STATUS_ICONS[status]} size={14} />
                        {RSVP_STATUS_LABELS[status]}
                      </button>
                    );
                  })}
                  {myRsvp && (
                    <button
                      type="button"
                      disabled={rsvpPending}
                      onClick={() => cancelMutation.mutate()}
                      className="btn-ghost text-xs text-slate-400 hover:text-red-600"
                    >
                      Katılımı geri al
                    </button>
                  )}
                </div>
                {capacityFull && myRsvp !== "going" && (
                  <p className="mt-2 text-xs text-amber-600">
                    Kontenjan doldu — yalnızca &quot;İlgileniyorum&quot; seçeneği kullanılabilir.
                  </p>
                )}
              </div>
            )}

            {myRsvp && !isCancelled && activity.myRsvp?.checkedInAt && (
              <p className="mt-4 text-sm font-semibold text-emerald-700">
                Yoklaman alındı.
              </p>
            )}

            {myRsvp && !isCancelled && !isPast && (
              <div className="mt-4">
                <Link
                  to={`/activities/${activityId}/yoklama`}
                  className="btn-secondary inline-flex text-xs"
                >
                  <Icon name="scan" size={14} /> Yoklamaya Katıl
                </Link>
              </div>
            )}

            {isPast && !isCancelled && (
              <p className="mt-6 text-sm text-slate-400">Bu etkinlik sona erdi.</p>
            )}

            {rsvpError && (
              <div className="alert-error mt-4">
                {getErrorMessage(rsvpError, "Katılım güncellenemedi.")}
              </div>
            )}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
