import { useQuery } from "@tanstack/react-query";
import Modal from "@/shared/ui/Modal";
import {
  getClubPosterQrCodeAnalytics,
  getUniversityPosterQrCodeAnalytics,
} from "@/features/poster-qr/api/posterQr";
import PosterQrBarChart from "@/features/poster-qr/components/analytics/PosterQrBarChart";
import {
  analyticsTimezoneLabel,
  formatAnalyticsDay,
  formatAnalyticsHour,
} from "@/features/poster-qr/formatAnalytics";
import { getErrorMessage } from "@/shared/api/client";

interface PosterQrCodeAnalyticsModalProps {
  open: boolean;
  scope: "club" | "university";
  clubId?: string;
  universityId?: string;
  qrId: string | null;
  sourceLabel: string;
  timezone: string | null;
  onClose: () => void;
}

export default function PosterQrCodeAnalyticsModal({
  open,
  scope,
  clubId,
  universityId,
  qrId,
  sourceLabel,
  timezone,
  onClose,
}: PosterQrCodeAnalyticsModalProps) {
  const analyticsQuery = useQuery({
    queryKey:
      scope === "club"
        ? ["clubs", clubId, "poster-qr", qrId, "analytics"]
        : ["universities", universityId, "poster-qr", qrId, "analytics"],
    queryFn: () =>
      scope === "club"
        ? getClubPosterQrCodeAnalytics(clubId!, qrId!)
        : getUniversityPosterQrCodeAnalytics(universityId!, qrId!),
    enabled: open && !!qrId && (scope === "club" ? !!clubId : !!universityId),
  });

  const tz = timezone ?? "UTC";
  const tzLabel = analyticsTimezoneLabel(tz);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={sourceLabel}
      description={`Tarama dağılımı — ${tzLabel}`}
      size="lg"
      footer={
        <button type="button" className="btn-primary" onClick={onClose}>
          Kapat
        </button>
      }
    >
      {analyticsQuery.isLoading ? (
        <div className="skeleton h-40 w-full" />
      ) : analyticsQuery.isError ? (
        <div className="alert-error">
          {getErrorMessage(analyticsQuery.error, "Kod analitiği yüklenemedi.")}
        </div>
      ) : analyticsQuery.data ? (
        <div className="space-y-6">
          <p className="text-sm text-slate-500">
            Toplam{" "}
            <span className="font-semibold text-slate-700">{analyticsQuery.data.totalScans}</span>{" "}
            tarama
          </p>

          <section>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              Günlük dağılım
            </h4>
            <PosterQrBarChart
              items={analyticsQuery.data.byDay.map((row) => ({
                key: row.day,
                label: formatAnalyticsDay(row.day, tz),
                count: row.count,
              }))}
            />
          </section>

          <section>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              Saatlik dağılım ({tzLabel})
            </h4>
            <PosterQrBarChart
              items={analyticsQuery.data.byHour.map((row) => ({
                key: String(row.hour),
                label: formatAnalyticsHour(row.hour),
                count: row.count,
              }))}
              emptyLabel="Henüz saatlik tarama yok."
            />
          </section>
        </div>
      ) : null}
    </Modal>
  );
}
