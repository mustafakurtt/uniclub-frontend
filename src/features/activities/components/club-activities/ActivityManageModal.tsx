import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getActivity } from "@/features/activities/api/activities";
import { cancelClubActivity } from "@/features/activities/api/clubActivities";
import {
  publishActivityNow,
  publishActivityScheduled,
  cancelActivityScheduledPublish,
} from "@/features/activities/publishActivity";
import { declineActivityCoHostInvite } from "@/features/activities/api/clubActivities";
import { getErrorMessage } from "@/shared/api/client";
import { invalidateActivityQueries } from "@/features/activities/invalidateActivities";
import { ACTIVITY_STATUS_LABELS, SCHEDULED_PUBLISH_LABEL } from "@/features/activities/labels";
import { isScheduledDraft } from "@/shared/lib/publishState";
import ScheduledPublishManage from "@/shared/ui/ScheduledPublishManage";
import Modal from "@/shared/ui/Modal";
import ActivityAttendeesModal from "@/features/activities/components/club-activities/ActivityAttendeesModal";
import ActivityCoHostsPanel from "@/features/activities/components/club-activities/ActivityCoHostsPanel";
import ActivityCancelDialog from "@/features/activities/components/club-activities/ActivityCancelDialog";
import ActivityFormModal from "@/features/activities/components/club-activities/ActivityFormModal";
import type { ActivityListItem } from "@/shared/types";
import { Icon } from "@/shared/ui/Icon";

interface ActivityManageModalProps {
  open: boolean;
  clubId: string;
  activity: ActivityListItem;
  onClose: () => void;
  onUpdated: () => void;
}

export default function ActivityManageModal({
  open,
  clubId,
  activity,
  onClose,
  onUpdated,
}: ActivityManageModalProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ["activities", activity.id],
    queryFn: () => getActivity(activity.id),
    enabled: open,
  });

  const invalidate = () => {
    invalidateActivityQueries(queryClient, clubId, activity.id);
    onUpdated();
  };

  const isHost = detailQuery.data?.hostClub.id === clubId;
  const isCoHostOnly =
    !isHost && detailQuery.data?.coHostClubs.some((c) => c.id === clubId) === true;

  const detail = detailQuery.data;
  const status = detail?.status ?? activity.status;
  const scheduledAt = detail?.scheduledPublishAt ?? activity.scheduledPublishAt ?? null;
  const scheduled = status === "draft" && isScheduledDraft({ status, scheduledPublishAt: scheduledAt });

  const cancelMutation = useMutation({
    mutationFn: () => cancelClubActivity(clubId, activity.id),
    onSuccess: () => {
      setActionError(null);
      setShowCancel(false);
      invalidate();
      onClose();
    },
    onError: (err) => setActionError(getErrorMessage(err, "İptal edilemedi.")),
  });

  const leaveCoHostMutation = useMutation({
    mutationFn: () => declineActivityCoHostInvite(clubId, activity.id),
    onSuccess: () => {
      setActionError(null);
      invalidate();
      onClose();
    },
    onError: (err) => setActionError(getErrorMessage(err, "Ayrılınamadı.")),
  });

  const canEdit = isHost && status !== "cancelled";
  const canCancel = isHost && status !== "cancelled";
  const showDraftPublish = isHost && status === "draft";

  return (
    <>
      <Modal
        open={open && !editing}
        onClose={onClose}
        title="Etkinlik Yönetimi"
        description={activity.title}
        size="lg"
        footer={
          <button type="button" className="btn-primary" onClick={onClose}>
            Kapat
          </button>
        }
      >
        {detailQuery.isLoading ? (
          <div className="skeleton h-24 w-full" />
        ) : detailQuery.isError ? (
          <div className="alert-error">
            {getErrorMessage(detailQuery.error, "Etkinlik yüklenemedi.")}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <span className="chip">{ACTIVITY_STATUS_LABELS[status]}</span>
              {scheduled && (
                <span className="chip bg-violet-50 text-violet-700">{SCHEDULED_PUBLISH_LABEL}</span>
              )}
              {isHost && <span className="chip bg-brand-50 text-brand-700">Host kulüp</span>}
              {isCoHostOnly && (
                <span className="chip bg-amber-50 text-amber-700">Co-host</span>
              )}
            </div>

            {actionError && <div className="alert-error">{actionError}</div>}

            {showDraftPublish && (
              <ScheduledPublishManage
                scheduledPublishAt={scheduledAt}
                onPublishNow={() => publishActivityNow(clubId, activity.id).then(() => invalidate())}
                onSchedule={(local) =>
                  publishActivityScheduled(clubId, activity.id, local).then(() => invalidate())
                }
                onCancelSchedule={() =>
                  cancelActivityScheduledPublish(clubId, activity.id).then(() => invalidate())
                }
                actionError={actionError}
                onClearError={() => setActionError(null)}
              />
            )}

            {isHost && (
              <div className="flex flex-wrap gap-2">
                {canEdit && (
                  <button type="button" className="btn-secondary text-xs" onClick={() => setEditing(true)}>
                    <Icon name="edit" size={14} /> Düzenle
                  </button>
                )}
                {status === "published" && (
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={() => setShowAttendees(true)}
                  >
                    <Icon name="members" size={14} /> Katılımcılar
                  </button>
                )}
                {canCancel && (
                  <button
                    type="button"
                    className="btn-ghost text-xs text-red-600"
                    onClick={() => setShowCancel(true)}
                  >
                    İptal Et
                  </button>
                )}
              </div>
            )}

            {isCoHostOnly && (
              <div>
                <p className="mb-2 text-sm text-slate-600">
                  Bu etkinlikte co-hostsunuz. Yönetim yalnızca host kulübe aittir; ortaklıktan
                  ayrılabilirsiniz.
                </p>
                <button
                  type="button"
                  className="btn-ghost text-xs text-red-600"
                  disabled={leaveCoHostMutation.isPending}
                  onClick={() => leaveCoHostMutation.mutate()}
                >
                  Ortaklıktan Ayrıl
                </button>
              </div>
            )}

            {isHost && status !== "cancelled" && (
              <div>
                <h4 className="mb-2 font-display text-sm font-bold text-slate-900">Co-host kulüpler</h4>
                <ActivityCoHostsPanel hostClubId={clubId} activityId={activity.id} />
              </div>
            )}
          </div>
        )}
      </Modal>

      <ActivityFormModal
        open={editing}
        clubId={clubId}
        activity={activity}
        onSaved={() => {
          invalidate();
          detailQuery.refetch();
          setEditing(false);
        }}
        onClose={() => setEditing(false)}
      />

      <ActivityAttendeesModal
        open={showAttendees}
        clubId={clubId}
        activityId={activity.id}
        activityTitle={activity.title}
        onClose={() => setShowAttendees(false)}
      />

      <ActivityCancelDialog
        open={showCancel}
        title={activity.title}
        loading={cancelMutation.isPending}
        error={cancelMutation.isError ? getErrorMessage(cancelMutation.error, "İptal edilemedi.") : null}
        onConfirm={() => cancelMutation.mutate()}
        onClose={() => {
          setShowCancel(false);
          cancelMutation.reset();
        }}
      />
    </>
  );
}
