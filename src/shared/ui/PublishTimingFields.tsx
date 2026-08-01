import { useTenantTimezone } from "@/features/auth/hooks/useTenantTimezone";
import {
  formatTimezoneShortLabel,
  isTenantLocalDatetimeInPast,
  isValidScheduledPublishLocal,
  tenantNowLocalDatetime,
} from "@/shared/lib/tenantLocalDatetime";

export type PublishTimingMode = "draft" | "now" | "scheduled";

interface PublishTimingFieldsProps {
  mode: PublishTimingMode;
  onModeChange: (mode: PublishTimingMode) => void;
  scheduledAtLocal: string;
  onScheduledAtLocalChange: (value: string) => void;
  /** Düzenleme: yalnızca taslak + zamanlama seçenekleri */
  hideNow?: boolean;
  hideDraft?: boolean;
  error?: string | null;
}

/**
 * Yayın zamanı seçimi — etkinlik ve duyuru formlarında ortak.
 * Zamanlanmış saat tenant duvar saati olarak gönderilir (UTC dönüşümü yok).
 */
export default function PublishTimingFields({
  mode,
  onModeChange,
  scheduledAtLocal,
  onScheduledAtLocalChange,
  hideNow,
  hideDraft,
  error,
}: PublishTimingFieldsProps) {
  const timezone = useTenantTimezone();
  const min = timezone ? tenantNowLocalDatetime(timezone) : undefined;
  const tzLabel = timezone ? formatTimezoneShortLabel(timezone) : "kurum saati";

  const scheduleError =
    mode === "scheduled" && scheduledAtLocal
      ? !isValidScheduledPublishLocal(scheduledAtLocal)
        ? "Geçerli bir tarih ve saat girin."
        : timezone && isTenantLocalDatetimeInPast(scheduledAtLocal, timezone)
          ? "Yayın zamanı geçmişte olamaz."
          : null
      : null;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Yayın zamanı</p>

      <div className="flex flex-wrap gap-3">
        {!hideDraft && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="publish-timing"
              checked={mode === "draft"}
              onChange={() => onModeChange("draft")}
            />
            Taslak
          </label>
        )}
        {!hideNow && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="publish-timing"
              checked={mode === "now"}
              onChange={() => onModeChange("now")}
            />
            Şimdi yayınla
          </label>
        )}
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name="publish-timing"
            checked={mode === "scheduled"}
            onChange={() => onModeChange("scheduled")}
          />
          İleri tarihte yayınla
        </label>
      </div>

      {mode === "scheduled" && (
        <div>
          <label className="input-label">
            Yayın tarihi ve saati ({tzLabel})
          </label>
          <input
            type="datetime-local"
            value={scheduledAtLocal}
            min={min}
            onChange={(e) => onScheduledAtLocalChange(e.target.value)}
            className="input-field"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Kurumun duvar saati — tarayıcı saat dilimine çevrilmez; girdiğiniz saat olduğu gibi
            gönderilir.
          </p>
          {(scheduleError || error) && (
            <p className="input-error mt-1">{scheduleError ?? error}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function validatePublishTiming(
  mode: PublishTimingMode,
  scheduledAtLocal: string,
  timezone: string | null
): string | null {
  if (mode !== "scheduled") return null;
  if (!scheduledAtLocal) return "Yayın zamanı zorunludur.";
  if (!isValidScheduledPublishLocal(scheduledAtLocal)) return "Geçerli bir tarih ve saat girin.";
  if (timezone && isTenantLocalDatetimeInPast(scheduledAtLocal, timezone)) {
    return "Yayın zamanı geçmişte olamaz.";
  }
  return null;
}
