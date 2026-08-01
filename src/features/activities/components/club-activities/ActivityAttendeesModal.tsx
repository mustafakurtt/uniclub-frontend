import { useQuery } from "@tanstack/react-query";
import { getActivityAttendees } from "@/features/activities/api/clubActivities";
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
  onClose: () => void;
}

export default function ActivityAttendeesModal({
  open,
  clubId,
  activityId,
  activityTitle,
  onClose,
}: ActivityAttendeesModalProps) {
  const attendeesQuery = useQuery({
    queryKey: ["clubs", clubId, "activities", activityId, "attendees"],
    queryFn: () => getActivityAttendees(clubId, activityId),
    enabled: open && !!activityId,
  });

  const attendees = attendeesQuery.data ?? [];

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
          {attendees.map((row) => (
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
              <div className="text-right">
                <span className="chip text-[11px]">
                  {RSVP_STATUS_LABELS[row.status as keyof typeof RSVP_STATUS_LABELS] ?? row.status}
                </span>
                {row.checkedInAt && (
                  <p className="mt-1 flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-600">
                    <Icon name="check" size={11} /> Yoklama alındı
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
