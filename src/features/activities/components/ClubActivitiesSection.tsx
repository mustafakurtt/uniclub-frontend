import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getClubActivities } from "@/features/activities/api/activities";
import { getErrorMessage } from "@/shared/api/client";
import { formatActivityDateTime, formatScheduledPublishAt } from "@/features/activities/formatActivityDateTime";
import { ACTIVITY_STATUS_LABELS, SCHEDULED_PUBLISH_LABEL } from "@/features/activities/labels";
import { useTenantTimezone } from "@/features/auth/hooks/useTenantTimezone";
import { invalidateActivityQueries } from "@/features/activities/invalidateActivities";
import { isScheduledDraft } from "@/shared/lib/publishState";
import ActivityFormModal from "@/features/activities/components/club-activities/ActivityFormModal";
import ActivityManageModal from "@/features/activities/components/club-activities/ActivityManageModal";
import ClubCoHostInvitesPanel from "@/features/activities/components/club-activities/ClubCoHostInvitesPanel";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import type { ActivityListItem } from "@/shared/types";

interface ClubActivitiesSectionProps {
  clubId: string;
  canManage: boolean;
}

export default function ClubActivitiesSection({ clubId, canManage }: ClubActivitiesSectionProps) {
  const queryClient = useQueryClient();
  const timezone = useTenantTimezone();
  const [creating, setCreating] = useState(false);
  const [manageTarget, setManageTarget] = useState<ActivityListItem | null>(null);

  const activitiesQuery = useQuery({
    queryKey: ["clubs", clubId, "activities"],
    queryFn: () => getClubActivities(clubId),
  });

  const invalidate = () => invalidateActivityQueries(queryClient, clubId);

  const activities = activitiesQuery.data ?? [];
  const plainDrafts = canManage
    ? activities.filter((a) => a.status === "draft" && !isScheduledDraft(a))
    : [];
  const scheduledDrafts = canManage ? activities.filter((a) => isScheduledDraft(a)) : [];
  const published = activities.filter((a) => a.status !== "draft");

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="icon-tile">
            <Icon name="calendar" size={24} className="text-brand-600" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Etkinlikler</h2>
            <p className="text-xs text-slate-500">Bu kulübün etkinlikleri</p>
          </div>
        </div>
        {canManage && (
          <button className="btn-secondary text-xs" onClick={() => setCreating(true)}>
            + Etkinlik
          </button>
        )}
      </div>

      {canManage && <ClubCoHostInvitesPanel clubId={clubId} />}

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
        <div className="space-y-6">
          {scheduledDrafts.length > 0 && (
            <ListSection title="Zamanlanmış taslaklar (yalnızca staff)">
              <ActivityList
                items={scheduledDrafts}
                canManage={canManage}
                timezone={timezone}
                onManage={setManageTarget}
                showScheduled
              />
            </ListSection>
          )}
          {plainDrafts.length > 0 && (
            <ListSection title="Taslaklar (yalnızca staff)">
              <ActivityList
                items={plainDrafts}
                canManage={canManage}
                timezone={timezone}
                onManage={setManageTarget}
              />
            </ListSection>
          )}
          {published.length > 0 && (
            <ActivityList
              items={published}
              canManage={canManage}
              timezone={timezone}
              onManage={setManageTarget}
            />
          )}
        </div>
      )}

      <ActivityFormModal
        open={creating}
        clubId={clubId}
        onSaved={invalidate}
        onClose={() => setCreating(false)}
      />

      {manageTarget && (
        <ActivityManageModal
          open={!!manageTarget}
          clubId={clubId}
          activity={manageTarget}
          onClose={() => setManageTarget(null)}
          onUpdated={invalidate}
        />
      )}
    </section>
  );
}

function ListSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">{title}</h3>
      {children}
    </div>
  );
}

function ActivityList({
  items,
  canManage,
  timezone,
  onManage,
  showScheduled,
}: {
  items: ActivityListItem[];
  canManage: boolean;
  timezone: string | null;
  onManage: (a: ActivityListItem) => void;
  showScheduled?: boolean;
}) {
  return (
    <ul className="space-y-3">
      {items.map((a) => (
        <li key={a.id}>
          <div className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/70 p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/30">
            <Link to={`/activities/${a.id}`} className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-display font-bold text-slate-900 group-hover:text-brand-700">
                  {a.title}
                </h3>
                {a.status === "draft" && !showScheduled && (
                  <span className="chip bg-slate-100 text-[10px] text-slate-600">
                    {ACTIVITY_STATUS_LABELS.draft}
                  </span>
                )}
                {showScheduled && (
                  <span className="chip bg-violet-50 text-[10px] text-violet-700">
                    {SCHEDULED_PUBLISH_LABEL}
                  </span>
                )}
                {a.status === "published" && (
                  <span className="chip bg-emerald-50 text-[10px] text-emerald-700">
                    {ACTIVITY_STATUS_LABELS.published}
                  </span>
                )}
                {a.status === "cancelled" && (
                  <span className="chip bg-red-50 text-[10px] text-red-600">
                    {ACTIVITY_STATUS_LABELS.cancelled}
                  </span>
                )}
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <Icon name="calendar" size={12} className="text-brand-500" />
                {formatActivityDateTime(a.startsAt, timezone)}
                {a.location && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="truncate">{a.location}</span>
                  </>
                )}
              </p>
              {showScheduled && a.scheduledPublishAt && timezone && (
                <p className="mt-1 text-[11px] font-semibold text-violet-600">
                  Yayın: {formatScheduledPublishAt(a.scheduledPublishAt, timezone)}
                </p>
              )}
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              {canManage && (
                <button type="button" className="btn-ghost text-xs" onClick={() => onManage(a)}>
                  Yönet
                </button>
              )}
              <Link to={`/activities/${a.id}`} aria-label="Detaya git">
                <Icon
                  name="chevronRight"
                  size={18}
                  className="text-slate-300 group-hover:text-brand-600"
                />
              </Link>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
