import { useQuery } from "@tanstack/react-query";
import {
  getClubPosterQrAnalytics,
  getUniversityPosterQrAnalytics,
} from "@/features/poster-qr/api/posterQr";
import { POSTER_QR_TARGET_LABELS } from "@/features/poster-qr/labels";
import { analyticsTimezoneLabel } from "@/features/poster-qr/formatAnalytics";
import { getErrorMessage } from "@/shared/api/client";
import type { PosterQrTargetSourceComparison } from "@/shared/types";

interface PosterQrAnalyticsOverviewProps {
  scope: "club" | "university";
  clubId?: string;
  universityId?: string;
  targetLabels: Map<string, string>;
  onSelectCode: (qrId: string, sourceLabel: string) => void;
}

function resolveTargetTitle(
  target: PosterQrTargetSourceComparison,
  targetLabels: Map<string, string>
): string {
  const id = target.targetType === "club" ? target.targetClubId : target.targetActivityId;
  const name = id ? targetLabels.get(id) : undefined;
  const typeLabel = POSTER_QR_TARGET_LABELS[target.targetType];
  return name ? `${typeLabel}: ${name}` : typeLabel;
}

export default function PosterQrAnalyticsOverview({
  scope,
  clubId,
  universityId,
  targetLabels,
  onSelectCode,
}: PosterQrAnalyticsOverviewProps) {
  const analyticsQuery = useQuery({
    queryKey:
      scope === "club"
        ? ["clubs", clubId, "poster-qr", "analytics"]
        : ["universities", universityId, "poster-qr", "analytics"],
    queryFn: () =>
      scope === "club"
        ? getClubPosterQrAnalytics(clubId!)
        : getUniversityPosterQrAnalytics(universityId!),
    enabled: scope === "club" ? !!clubId : !!universityId,
  });

  if (analyticsQuery.isLoading) {
    return <div className="skeleton mb-6 h-32 w-full" />;
  }

  if (analyticsQuery.isError) {
    return (
      <div className="alert-error mb-6">
        {getErrorMessage(analyticsQuery.error, "Tarama analitiği yüklenemedi.")}
      </div>
    );
  }

  const data = analyticsQuery.data;
  if (!data) return null;

  const timezone = data.timezone;
  const tzLabel = analyticsTimezoneLabel(timezone);
  const targets = [...data.targets].sort((a, b) => b.totalScans - a.totalScans);
  const grandTotal = targets.reduce((sum, t) => sum + t.totalScans, 0);

  if (targets.length === 0) {
    return (
      <div className="mb-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-sm text-slate-500">
        Henüz tarama verisi yok. QR kodları oluşturup afişlere yerleştirdikten sonra kaynak
        karşılaştırması burada görünür.
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-display text-sm font-bold text-slate-900">Kaynak karşılaştırması</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Aynı hedefe bağlı kodlar yan yana — hangi kanal daha çok tarandı?
          </p>
        </div>
        <p className="text-xs text-slate-400">
          Saat dilimi: <span className="font-semibold text-slate-600">{tzLabel}</span>
          <span className="mx-2">·</span>
          Toplam <span className="font-semibold text-slate-600">{grandTotal}</span> tarama
        </p>
      </div>

      <div className="space-y-4">
        {targets.map((target) => {
          const maxInGroup = Math.max(...target.sources.map((s) => s.scanCount), 1);
          return (
            <article
              key={`${target.targetType}:${target.targetClubId ?? ""}:${target.targetActivityId ?? ""}`}
              className="rounded-2xl border border-slate-100 bg-white/80 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-semibold text-slate-800">{resolveTargetTitle(target, targetLabels)}</h4>
                <span className="text-xs text-slate-400">{target.totalScans} tarama</span>
              </div>

              <div className="space-y-2">
                {target.sources.map((source) => (
                  <div
                    key={source.qrId}
                    className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-xl px-1 py-0.5 hover:bg-slate-50"
                  >
                    <div className="grid grid-cols-[minmax(5rem,8rem)_1fr_2rem] items-center gap-2 text-xs">
                      <span className="truncate font-semibold text-slate-800" title={source.sourceLabel}>
                        {source.sourceLabel}
                      </span>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-accent-500"
                          style={{ width: `${(source.scanCount / maxInGroup) * 100}%` }}
                        />
                      </div>
                      <span className="text-right font-bold tabular-nums text-slate-700">
                        {source.scanCount}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-ghost shrink-0 text-[11px]"
                      onClick={() => onSelectCode(source.qrId, source.sourceLabel)}
                    >
                      Detay
                    </button>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
