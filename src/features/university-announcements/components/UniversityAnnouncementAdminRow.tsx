import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  deleteUniversityAnnouncement,
  updateUniversityAnnouncement,
} from "@/features/university-announcements/api/universityAnnouncements";
import {
  cancelUniversityAnnouncementScheduledPublish,
  publishUniversityAnnouncementNow,
  publishUniversityAnnouncementScheduled,
} from "@/features/university-announcements/publishUniversityAnnouncement";
import {
  SCHEDULED_PUBLISH_LABEL,
  UNIVERSITY_ANNOUNCEMENT_STATUS_LABELS,
} from "@/features/university-announcements/labels";
import { formatScheduledPublishAt } from "@/features/activities/formatActivityDateTime";
import { useTenantTimezone } from "@/features/auth/hooks/useTenantTimezone";
import { getErrorMessage } from "@/shared/api/client";
import { isScheduledDraft } from "@/shared/lib/publishState";
import ScheduledPublishManage from "@/shared/ui/ScheduledPublishManage";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import IconButton from "@/shared/ui/IconButton";
import { Icon } from "@/shared/ui/Icon";
import type { UniversityAnnouncement } from "@/shared/types";

interface Props {
  universityId: string;
  announcement: UniversityAnnouncement;
  onUpdated: () => void;
}

export default function UniversityAnnouncementAdminRow({
  universityId,
  announcement,
  onUpdated,
}: Props) {
  const timezone = useTenantTimezone();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const scheduled = isScheduledDraft(announcement);

  const pinMutation = useMutation({
    mutationFn: (pinned: boolean) =>
      updateUniversityAnnouncement(universityId, announcement.id, { pinned }),
    onSuccess: () => {
      setActionError(null);
      onUpdated();
    },
    onError: (err) => setActionError(getErrorMessage(err, "Sabitleme güncellenemedi.")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUniversityAnnouncement(universityId, announcement.id),
    onSuccess: () => {
      setDeleteOpen(false);
      onUpdated();
    },
  });

  const dateLabel =
    announcement.status === "published" && announcement.publishedAt
      ? new Date(announcement.publishedAt).toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : new Date(announcement.createdAt).toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

  const busy = pinMutation.isPending || deleteMutation.isPending;

  return (
    <li className="rounded-2xl border border-slate-100 bg-white/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display font-bold text-slate-900">{announcement.title}</h3>
            {announcement.pinned && (
              <span className="chip gap-1 bg-amber-50 text-[10px] text-amber-700">
                <Icon name="pin" size={11} /> Sabit
              </span>
            )}
            {announcement.status === "draft" && !scheduled && (
              <span className="chip bg-slate-100 text-[10px] text-slate-600">
                {UNIVERSITY_ANNOUNCEMENT_STATUS_LABELS.draft}
              </span>
            )}
            {scheduled && (
              <span className="chip bg-violet-50 text-[10px] text-violet-700">
                {SCHEDULED_PUBLISH_LABEL}
              </span>
            )}
            {announcement.status === "published" && (
              <span className="chip bg-emerald-50 text-[10px] text-emerald-700">
                {UNIVERSITY_ANNOUNCEMENT_STATUS_LABELS.published}
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {announcement.content}
          </p>
          <p className="mt-2 text-[11px] font-semibold text-slate-400">
            {announcement.author
              ? `${announcement.author.firstName} ${announcement.author.lastName} · `
              : ""}
            {dateLabel}
            {scheduled && timezone && announcement.scheduledPublishAt && (
              <>
                {" · Yayın: "}
                {formatScheduledPublishAt(announcement.scheduledPublishAt, timezone)}
              </>
            )}
          </p>

          {actionError && <div className="alert-error mt-3">{actionError}</div>}

          {announcement.status === "draft" && (
            <div className="mt-3">
              <ScheduledPublishManage
                scheduledPublishAt={announcement.scheduledPublishAt ?? null}
                onPublishNow={() =>
                  publishUniversityAnnouncementNow(universityId, announcement.id).then(onUpdated)
                }
                onSchedule={(local) =>
                  publishUniversityAnnouncementScheduled(
                    universityId,
                    announcement.id,
                    local,
                  ).then(onUpdated)
                }
                onCancelSchedule={() =>
                  cancelUniversityAnnouncementScheduledPublish(
                    universityId,
                    announcement.id,
                  ).then(onUpdated)
                }
                actionError={actionError}
                onClearError={() => setActionError(null)}
              />
            </div>
          )}

          {announcement.status === "published" && (
            <div className="mt-3">
              <button
                type="button"
                className="btn-secondary text-xs"
                disabled={busy}
                onClick={() => pinMutation.mutate(!announcement.pinned)}
              >
                {announcement.pinned ? "Sabitlemeyi kaldır" : "Sabitle"}
              </button>
            </div>
          )}
        </div>
        <IconButton
          icon="delete"
          label="Duyuruyu sil"
          tone="danger"
          className="shrink-0"
          disabled={busy}
          onClick={() => setDeleteOpen(true)}
        />
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title={`"${announcement.title}" silinsin mi?`}
        confirmLabel="Sil"
        loading={deleteMutation.isPending}
        error={deleteMutation.isError ? getErrorMessage(deleteMutation.error, "Silinemedi.") : null}
        onConfirm={() => deleteMutation.mutate()}
        onClose={() => {
          setDeleteOpen(false);
          deleteMutation.reset();
        }}
      />
    </li>
  );
}
