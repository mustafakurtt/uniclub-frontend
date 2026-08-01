import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTenantTimezone } from "@/features/auth/hooks/useTenantTimezone";
import { getErrorMessage } from "@/shared/api/client";
import { formatScheduledPublishAt } from "@/features/activities/formatActivityDateTime";
import { scheduledUtcToTenantLocal } from "@/shared/lib/tenantLocalDatetime";
import PublishTimingFields, {
  validatePublishTiming,
  type PublishTimingMode,
} from "@/shared/ui/PublishTimingFields";
import { Icon } from "@/shared/ui/Icon";

interface ScheduledPublishManageProps {
  scheduledPublishAt: string | null;
  onPublishNow: () => Promise<void>;
  onSchedule: (scheduledPublishAtLocal: string) => Promise<void>;
  onCancelSchedule: () => Promise<void>;
  actionError?: string | null;
  onClearError?: () => void;
}

/** Zamanlanmış taslak yönetimi — etkinlik ve duyuru satırlarında ortak. */
export default function ScheduledPublishManage({
  scheduledPublishAt,
  onPublishNow,
  onSchedule,
  onCancelSchedule,
  actionError,
  onClearError,
}: ScheduledPublishManageProps) {
  const timezone = useTenantTimezone();
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<PublishTimingMode>("scheduled");
  const [scheduledAtLocal, setScheduledAtLocal] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const nowMutation = useMutation({
    mutationFn: onPublishNow,
    onSuccess: () => {
      setLocalError(null);
      onClearError?.();
    },
    onError: (err) => setLocalError(getErrorMessage(err, "Yayınlanamadı.")),
  });

  const scheduleMutation = useMutation({
    mutationFn: () => {
      const err = validatePublishTiming("scheduled", scheduledAtLocal, timezone);
      if (err) {
        setLocalError(err);
        return Promise.reject(new Error(err));
      }
      return onSchedule(scheduledAtLocal);
    },
    onSuccess: () => {
      setLocalError(null);
      setEditing(false);
      onClearError?.();
    },
    onError: (err) =>
      setLocalError(err instanceof Error && err.message ? err.message : getErrorMessage(err, "Zamanlanamadı.")),
  });

  const cancelMutation = useMutation({
    mutationFn: onCancelSchedule,
    onSuccess: () => {
      setEditing(false);
      onClearError?.();
    },
    onError: (err) => setLocalError(getErrorMessage(err, "Zamanlama iptal edilemedi.")),
  });

  const busy = nowMutation.isPending || scheduleMutation.isPending || cancelMutation.isPending;
  const displayError = localError ?? actionError;

  const openEdit = () => {
    if (scheduledPublishAt && timezone) {
      setScheduledAtLocal(scheduledUtcToTenantLocal(scheduledPublishAt, timezone));
    }
    setMode("scheduled");
    setEditing(true);
    setLocalError(null);
  };

  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon name="pending" size={16} className="text-violet-600" />
        <span className="font-display text-sm font-bold text-violet-900">Yayın planı</span>
      </div>

      {scheduledPublishAt && timezone && !editing && (
        <p className="mb-3 text-sm text-slate-700">
          Yayın: <strong>{formatScheduledPublishAt(scheduledPublishAt, timezone)}</strong>
        </p>
      )}

      {displayError && <div className="alert-error mb-3">{displayError}</div>}

      {editing ? (
        <div className="space-y-3">
          <PublishTimingFields
            mode={mode}
            onModeChange={setMode}
            scheduledAtLocal={scheduledAtLocal}
            onScheduledAtLocalChange={setScheduledAtLocal}
            hideDraft
            hideNow
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary text-xs"
              disabled={busy}
              onClick={() => scheduleMutation.mutate()}
            >
              {scheduleMutation.isPending ? "Kaydediliyor..." : "Planı Güncelle"}
            </button>
            <button
              type="button"
              className="btn-ghost text-xs"
              disabled={busy}
              onClick={() => setEditing(false)}
            >
              Vazgeç
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary text-xs"
            disabled={busy}
            onClick={() => nowMutation.mutate()}
          >
            {nowMutation.isPending ? "Yayınlanıyor..." : "Şimdi Yayınla"}
          </button>
          <button type="button" className="btn-secondary text-xs" disabled={busy} onClick={openEdit}>
            {scheduledPublishAt ? "Tarihi Değiştir" : "Zamanla"}
          </button>
          {scheduledPublishAt && (
            <button
              type="button"
              className="btn-ghost text-xs text-slate-500"
              disabled={busy}
              onClick={() => cancelMutation.mutate()}
            >
              {cancelMutation.isPending ? "İptal ediliyor..." : "Zamanlamayı İptal Et"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
