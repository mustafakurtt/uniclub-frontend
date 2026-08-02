import { useState } from "react";
import SelectField from "@/shared/ui/SelectField";
import { useMutation } from "@tanstack/react-query";
import { deleteAnnouncement, updateAnnouncement } from "@/features/clubs/api/clubs";
import {
  publishAnnouncementNow,
  publishAnnouncementScheduled,
  cancelAnnouncementScheduledPublish,
} from "@/features/clubs/publishAnnouncement";
import { getErrorMessage } from "@/shared/api/client";
import { formatEditedAtLabel } from "@/shared/lib/announcementEdited";
import {
  ANNOUNCEMENT_STATUS_LABELS,
  ANNOUNCEMENT_VISIBILITY_LABELS,
  SCHEDULED_PUBLISH_LABEL,
} from "@/features/clubs/labels";
import { formatScheduledPublishAt } from "@/features/activities/formatActivityDateTime";
import { useTenantTimezone } from "@/features/auth/hooks/useTenantTimezone";
import { isScheduledDraft } from "@/shared/lib/publishState";
import ScheduledPublishManage from "@/shared/ui/ScheduledPublishManage";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import AnnouncementFormModal from "@/features/clubs/components/announcements/AnnouncementFormModal";
import IconButton from "@/shared/ui/IconButton";
import { Icon } from "@/shared/ui/Icon";
import type { Announcement, AnnouncementVisibility } from "@/shared/types";

interface AnnouncementRowProps {
  clubId: string;
  announcement: Announcement;
  canManage: boolean;
  onUpdated: () => void;
}

export default function AnnouncementRow({
  clubId,
  announcement,
  canManage,
  onUpdated,
}: AnnouncementRowProps) {
  const timezone = useTenantTimezone();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const scheduled = isScheduledDraft(announcement);
  const editedLabel = formatEditedAtLabel(announcement.editedAt);

  const pinMutation = useMutation({
    mutationFn: (pinned: boolean) =>
      updateAnnouncement(clubId, announcement.id, { pinned }),
    onSuccess: () => {
      setActionError(null);
      onUpdated();
    },
    onError: (err) => setActionError(getErrorMessage(err, "Sabitleme güncellenemedi.")),
  });

  const visibilityMutation = useMutation({
    mutationFn: (visibility: AnnouncementVisibility) =>
      updateAnnouncement(clubId, announcement.id, { visibility }),
    onSuccess: () => {
      setActionError(null);
      onUpdated();
    },
    onError: (err) => setActionError(getErrorMessage(err, "Görünürlük güncellenemedi.")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAnnouncement(clubId, announcement.id),
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

  const busy = pinMutation.isPending || visibilityMutation.isPending || deleteMutation.isPending;

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
            {announcement.status === "draft" && canManage && !scheduled && (
              <span className="chip bg-slate-100 text-[10px] text-slate-600">
                {ANNOUNCEMENT_STATUS_LABELS.draft}
              </span>
            )}
            {scheduled && canManage && (
              <span className="chip bg-violet-50 text-[10px] text-violet-700">
                {SCHEDULED_PUBLISH_LABEL}
              </span>
            )}
            {announcement.status === "published" && (
              <span className="chip bg-emerald-50 text-[10px] text-emerald-700">
                {ANNOUNCEMENT_STATUS_LABELS.published}
              </span>
            )}
            <span className="chip text-[10px] text-slate-500">
              {ANNOUNCEMENT_VISIBILITY_LABELS[announcement.visibility]}
            </span>
            {editedLabel && (
              <span className="chip bg-slate-100 text-[10px] text-slate-500">{editedLabel}</span>
            )}
          </div>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {announcement.content}
          </p>
          <p className="mt-2 text-[11px] font-semibold text-slate-400">
            {announcement.author ? `${announcement.author.firstName} ${announcement.author.lastName} · ` : ""}
            {dateLabel}
            {editedLabel && announcement.editedAt && canManage && (
              <>
                {" · "}
                {new Date(announcement.editedAt).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                düzenlendi
              </>
            )}
            {!canManage && editedLabel && (
              <span className="text-slate-400"> · {editedLabel}</span>
            )}
            {scheduled && timezone && announcement.scheduledPublishAt && (
              <>
                {" · Yayın: "}
                {formatScheduledPublishAt(announcement.scheduledPublishAt, timezone)}
              </>
            )}
          </p>

          {actionError && <div className="alert-error mt-3">{actionError}</div>}

          {canManage && announcement.status === "draft" && (
            <div className="mt-3 space-y-3">
              <button
                type="button"
                className="btn-secondary text-xs"
                disabled={busy}
                onClick={() => setEditOpen(true)}
              >
                <Icon name="edit" size={13} /> Düzenle
              </button>
              <ScheduledPublishManage
                scheduledPublishAt={announcement.scheduledPublishAt ?? null}
                onPublishNow={() =>
                  publishAnnouncementNow(clubId, announcement.id).then(onUpdated)
                }
                onSchedule={(local) =>
                  publishAnnouncementScheduled(clubId, announcement.id, local).then(onUpdated)
                }
                onCancelSchedule={() =>
                  cancelAnnouncementScheduledPublish(clubId, announcement.id).then(onUpdated)
                }
                actionError={actionError}
                onClearError={() => setActionError(null)}
              />
            </div>
          )}

          {canManage && announcement.status === "published" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn-secondary text-xs"
                disabled={busy}
                onClick={() => setEditOpen(true)}
              >
                <Icon name="edit" size={13} /> Düzenle
              </button>
              <button
                type="button"
                className="btn-secondary text-xs"
                disabled={busy}
                onClick={() => pinMutation.mutate(!announcement.pinned)}
              >
                {announcement.pinned ? "Sabitlemeyi Kaldır" : "Sabitle"}
              </button>
              <SelectField
                value={announcement.visibility}
                disabled={busy}
                onChange={(e) =>
                  visibilityMutation.mutate(e.target.value as AnnouncementVisibility)
                }
                className="select-field w-auto min-w-[10rem] py-1.5 text-xs"
                aria-label="Görünürlük"
              >
                <option value="university">{ANNOUNCEMENT_VISIBILITY_LABELS.university}</option>
                <option value="members">{ANNOUNCEMENT_VISIBILITY_LABELS.members}</option>
              </SelectField>
            </div>
          )}
        </div>
        {canManage && (
          <IconButton
            icon="delete"
            label="Duyuruyu sil"
            tone="danger"
            className="shrink-0"
            disabled={busy}
            onClick={() => setDeleteOpen(true)}
          />
        )}
      </div>

      <AnnouncementFormModal
        open={editOpen}
        clubId={clubId}
        announcement={announcement}
        onSaved={onUpdated}
        onClose={() => setEditOpen(false)}
      />

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
