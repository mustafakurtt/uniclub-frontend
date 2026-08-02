import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  checkInAttendee,
  getActivityAttendees,
  undoCheckInAttendee,
} from "@/features/activities/api/clubActivities";
import { getErrorMessage } from "@/shared/api/client";
import { RSVP_STATUS_LABELS } from "@/features/activities/labels";
import Modal from "@/shared/ui/Modal";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";

interface ActivityAttendeesModalProps {
  open: boolean;
  clubId: string;
  activityId: string;
  activityTitle: string;
  canCheckIn?: boolean;
  onClose: () => void;
}

export default function ActivityAttendeesModal({
  open,
  clubId,
  activityId,
  activityTitle,
  canCheckIn = false,
  onClose,
}: ActivityAttendeesModalProps) {
  const queryClient = useQueryClient();
  const attendeesQueryKey = ["clubs", clubId, "activities", activityId, "attendees"] as const;

  const attendeesQuery = useQuery({
    queryKey: attendeesQueryKey,
    queryFn: () => getActivityAttendees(clubId, activityId),
    enabled: open && !!activityId,
  });

  const invalidateAttendees = () => {
    queryClient.invalidateQueries({ queryKey: attendeesQueryKey });
  };

  const checkInMutation = useMutation({
    mutationFn: (userId: string) => checkInAttendee(clubId, activityId, userId),
    onSuccess: invalidateAttendees,
  });

  const undoCheckInMutation = useMutation({
    mutationFn: (userId: string) => undoCheckInAttendee(clubId, activityId, userId),
    onSuccess: invalidateAttendees,
  });

  const attendees = attendeesQuery.data ?? [];
  const pendingUserId = checkInMutation.isPending
    ? checkInMutation.variables
    : undoCheckInMutation.isPending
      ? undoCheckInMutation.variables
      : null;
  const actionError = checkInMutation.isError
    ? getErrorMessage(checkInMutation.error, "Yoklama alınamadı.")
    : undoCheckInMutation.isError
      ? getErrorMessage(undoCheckInMutation.error, "Yoklama geri alınamadı.")
      : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Katılımcılar"
      description={activityTitle}
      size="lg"
      footer={
        <button type="button" className="btn-primary" onClick={onClose}>
          Kapat
        </button>
      }
    >
      {canCheckIn && (
        <p className="mb-4 text-xs text-slate-500">
          QR okunamayan katılımcılar için elle yoklama alabilirsin. Yoklama penceresi sunucu
          tarafında kontrol edilir.
        </p>
      )}

      {actionError && <div className="alert-error mb-4 text-sm">{actionError}</div>}

      {attendeesQuery.isLoading ? (
        <div className="space-y-2">
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
        </div>
      ) : attendeesQuery.isError ? (
        <div className="alert-error">
          {getErrorMessage(attendeesQuery.error, "Katılımcılar yüklenemedi.")}
        </div>
      ) : attendees.length === 0 ? (
        <EmptyState icon="members" title="Henüz katılımcı yok" />
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {attendees.map((row) => {
            const isPending = pendingUserId === row.user.id;
            const checkedIn = !!row.checkedInAt;

            return (
              <li
                key={row.user.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {row.user.firstName} {row.user.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{row.user.email}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="chip text-[11px]">
                    {RSVP_STATUS_LABELS[row.status as keyof typeof RSVP_STATUS_LABELS] ??
                      row.status}
                  </span>
                  {checkedIn && (
                    <p className="flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-600">
                      <Icon name="check" size={11} /> Yoklama alındı
                    </p>
                  )}
                  {canCheckIn && (
                    <button
                      type="button"
                      className={checkedIn ? "btn-ghost text-xs" : "btn-secondary text-xs"}
                      disabled={isPending}
                      onClick={() => {
                        checkInMutation.reset();
                        undoCheckInMutation.reset();
                        if (checkedIn) {
                          undoCheckInMutation.mutate(row.user.id);
                        } else {
                          checkInMutation.mutate(row.user.id);
                        }
                      }}
                    >
                      {isPending
                        ? "İşleniyor…"
                        : checkedIn
                          ? "Yoklamayı geri al"
                          : "Elle yoklama al"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
