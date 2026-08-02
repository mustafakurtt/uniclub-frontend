import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  cancelAdminActivity,
  updateAdminActivityVisibility,
} from "@/features/admin/api/activities";
import {
  filterAdminActivities,
  useAdminTenantActivities,
  type AdminActivityTab,
  type AdminTenantActivityRow,
} from "@/features/admin/hooks/useAdminTenantActivities";
import RequireUniversity from "@/features/admin/components/RequireUniversity";
import { getActivity } from "@/features/activities/api/activities";
import {
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_VISIBILITY_HINTS,
  ACTIVITY_VISIBILITY_LABELS,
} from "@/features/activities/labels";
import { formatActivityDateTime } from "@/features/activities/formatActivityDateTime";
import { getErrorMessage } from "@/shared/api/client";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import Modal from "@/shared/ui/Modal";
import SelectField from "@/shared/ui/SelectField";
import type { ActivityListItem, ActivityVisibility } from "@/shared/types";

const TAB_LABELS: Record<AdminActivityTab, string> = {
  upcoming: "Yaklaşan",
  past: "Geçmiş",
  cancelled: "İptal edilmiş",
};

const VISIBILITY_OPTIONS: ActivityVisibility[] = ["university", "members", "inter_university"];

function ActivitiesWorkspace({ universityId }: { universityId: string }) {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canModerate = hasPermission("activity.moderate");

  const [tab, setTab] = useState<AdminActivityTab>("upcoming");
  const [cancelTarget, setCancelTarget] = useState<ActivityListItem | null>(null);
  const [visibilityTarget, setVisibilityTarget] = useState<AdminTenantActivityRow | null>(null);
  const [nextVisibility, setNextVisibility] = useState<ActivityVisibility>("university");

  const activitiesQuery = useAdminTenantActivities(universityId, canModerate && hasPermission("club.view"));

  const hostClubQuery = useQuery({
    queryKey: ["activities", visibilityTarget?.activity.id, "host-club"],
    queryFn: () => getActivity(visibilityTarget!.activity.id),
    enabled: !!visibilityTarget,
    select: (detail) => detail.hostClub,
  });

  const invalidateActivities = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", universityId, "activities", "tenant"] });
  };

  const cancelMutation = useMutation({
    mutationFn: (activityId: string) => cancelAdminActivity(universityId, activityId),
    onSuccess: () => {
      invalidateActivities();
      setCancelTarget(null);
    },
  });

  const visibilityMutation = useMutation({
    mutationFn: ({
      hostClubId,
      activityId,
      visibility,
    }: {
      hostClubId: string;
      activityId: string;
      visibility: ActivityVisibility;
    }) => updateAdminActivityVisibility(universityId, hostClubId, activityId, visibility),
    onSuccess: () => {
      invalidateActivities();
      setVisibilityTarget(null);
    },
  });

  const rows = filterAdminActivities(activitiesQuery.data ?? [], tab);

  const openVisibilityModal = (row: AdminTenantActivityRow) => {
    setVisibilityTarget(row);
    setNextVisibility(row.activity.visibility);
    visibilityMutation.reset();
  };

  const closeVisibilityModal = () => {
    if (visibilityMutation.isPending) return;
    setVisibilityTarget(null);
    visibilityMutation.reset();
  };

  const confirmVisibility = () => {
    const hostClubId = hostClubQuery.data?.id;
    if (!visibilityTarget || !hostClubId) return;
    visibilityMutation.mutate({
      hostClubId,
      activityId: visibilityTarget.activity.id,
      visibility: nextVisibility,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TAB_LABELS) as AdminActivityTab[]).map((key) => (
          <button
            key={key}
            type="button"
            className="chip-filter"
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>

      {activitiesQuery.isLoading ? (
        <div className="space-y-3">
          <div className="skeleton h-20 w-full" />
          <div className="skeleton h-20 w-full" />
        </div>
      ) : activitiesQuery.isError ? (
        <div className="alert-error">
          {getErrorMessage(activitiesQuery.error, "Etkinlikler yüklenemedi.")}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon="calendar"
          title={`${TAB_LABELS[tab]} etkinlik yok`}
          description="Bu sekmede gösterilecek etkinlik bulunamadı."
        />
      ) : (
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white/70">
          {rows.map((row) => {
            const { activity, listedClubName } = row;
            const isCancelled = activity.status === "cancelled";

            return (
              <li
                key={activity.id}
                className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-slate-900">{activity.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatActivityDateTime(activity.startsAt)}
                    {activity.location ? ` · ${activity.location}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {listedClubName} · {ACTIVITY_VISIBILITY_LABELS[activity.visibility]}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="chip text-[11px]">{ACTIVITY_STATUS_LABELS[activity.status]}</span>
                  </div>
                </div>

                {canModerate && !isCancelled && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-ghost text-sm"
                      onClick={() => openVisibilityModal(row)}
                    >
                      Görünürlük
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-sm text-red-600 hover:text-red-700"
                      onClick={() => setCancelTarget(activity)}
                    >
                      İptal et
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        title={`"${cancelTarget?.title}" etkinliği iptal edilsin mi?`}
        description="Bu etkinliğe kayıt yaptırmış veya ilgi bildirmiş tüm kullanıcılar etkilenir; etkinlik iptal edildi olarak işaretlenir ve geri alınamaz."
        confirmLabel="Etkinliği iptal et"
        loading={cancelMutation.isPending}
        error={
          cancelMutation.isError
            ? getErrorMessage(cancelMutation.error, "Etkinlik iptal edilemedi.")
            : null
        }
        onConfirm={() => cancelTarget && cancelMutation.mutate(cancelTarget.id)}
        onClose={() => {
          setCancelTarget(null);
          cancelMutation.reset();
        }}
      />

      <Modal
        open={!!visibilityTarget}
        onClose={closeVisibilityModal}
        title="Görünürlüğü değiştir"
        description={
          visibilityTarget
            ? `“${visibilityTarget.activity.title}” etkinliğinin keşif kapsamını güncelle.`
            : undefined
        }
        footer={
          <>
            <button
              type="button"
              className="btn-ghost"
              onClick={closeVisibilityModal}
              disabled={visibilityMutation.isPending}
            >
              Vazgeç
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={confirmVisibility}
              disabled={
                visibilityMutation.isPending ||
                hostClubQuery.isLoading ||
                !hostClubQuery.data ||
                nextVisibility === visibilityTarget?.activity.visibility
              }
            >
              {visibilityMutation.isPending ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="input-label" htmlFor="activity-visibility-select">
              Görünürlük
            </label>
            <SelectField
              id="activity-visibility-select"
              className="select-field mt-1 w-full"
              value={nextVisibility}
              onChange={(e) => setNextVisibility(e.target.value as ActivityVisibility)}
              disabled={visibilityMutation.isPending}
            >
              {VISIBILITY_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {ACTIVITY_VISIBILITY_LABELS[value]}
                </option>
              ))}
            </SelectField>
            {ACTIVITY_VISIBILITY_HINTS[nextVisibility] && (
              <p className="mt-2 text-xs text-slate-500">{ACTIVITY_VISIBILITY_HINTS[nextVisibility]}</p>
            )}
          </div>

          {hostClubQuery.isError && (
            <div className="alert-error">
              {getErrorMessage(hostClubQuery.error, "Host kulüp bilgisi alınamadı.")}
            </div>
          )}
          {visibilityMutation.isError && (
            <div className="alert-error">
              {getErrorMessage(visibilityMutation.error, "Görünürlük güncellenemedi.")}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function AdminActivities() {
  const { hasPermission } = useAuth();
  const canModerate = hasPermission("activity.moderate");
  const canList = hasPermission("club.view");

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <span className="icon-tile">
          <Icon name="calendar" size={24} className="text-brand-600" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900">Etkinlikler</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kurumdaki kulüp etkinliklerini incele; gerekirse iptal et veya görünürlüğünü değiştir.
          </p>
        </div>
      </div>

      {!canModerate ? (
        <div className="alert-error">Bu bölüm için gerekli yetkin bulunmuyor.</div>
      ) : !canList ? (
        <div className="alert-error">
          Etkinlik listesi için <code className="text-xs">club.view</code> yetkisi gerekir.
        </div>
      ) : (
        <RequireUniversity>
          {(universityId) => <ActivitiesWorkspace universityId={universityId} />}
        </RequireUniversity>
      )}
    </div>
  );
}
