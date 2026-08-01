import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCheckInQr } from "@/features/activities/api/clubActivities";
import { getActivity } from "@/features/activities/api/activities";
import { checkInScanUrl } from "@/shared/lib/qrUrls";
import { getErrorMessage } from "@/shared/api/client";
import QrCodeDisplay from "@/shared/ui/QrCodeDisplay";
import PageLoader from "@/shared/ui/PageLoader";
import { Icon } from "@/shared/ui/Icon";

const REFETCH_MS = 25_000;

/**
 * Host staff yoklama ekranı — projeksiyon/tablet için büyük dönen QR.
 */
export default function ActivityCheckInDisplayPage() {
  const { clubId = "", activityId = "" } = useParams();
  const [secondsLeft, setSecondsLeft] = useState(0);

  const activityQuery = useQuery({
    queryKey: ["activities", activityId],
    queryFn: () => getActivity(activityId),
    enabled: !!activityId,
  });

  const qrQuery = useQuery({
    queryKey: ["check-in-qr", clubId, activityId],
    queryFn: () => getCheckInQr(clubId, activityId),
    enabled: !!clubId && !!activityId,
    refetchInterval: REFETCH_MS,
  });

  const expiresAt = qrQuery.data?.expiresAt;

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 3) void qrQuery.refetch();
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [expiresAt, qrQuery]);

  if (activityQuery.isLoading || qrQuery.isLoading) {
    return <PageLoader label="Yoklama QR hazırlanıyor…" />;
  }

  if (qrQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <div className="max-w-md text-center">
          <p className="text-lg font-semibold">Yoklama QR yüklenemedi</p>
          <p className="mt-2 text-sm text-slate-400">
            {getErrorMessage(qrQuery.error, "Yoklama henüz açılmamış veya süresi dolmuş olabilir.")}
          </p>
          <Link to={`/clubs/${clubId}`} className="btn-secondary mt-6 inline-flex text-slate-900">
            Kulübe Dön
          </Link>
        </div>
      </div>
    );
  }

  const token = qrQuery.data!.token;
  const scanUrl = checkInScanUrl(activityId, token);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <p className="mb-2 text-sm font-bold uppercase tracking-widest text-brand-300">Yoklama</p>
      <h1 className="max-w-3xl text-center font-display text-2xl font-extrabold md:text-4xl">
        {activityQuery.data?.title ?? "Etkinlik"}
      </h1>
      <p className="mt-3 text-center text-slate-400">
        Telefonunuzla QR kodu okutun — katılımınız işaretlenir.
      </p>

      <div className="my-10">
        <QrCodeDisplay value={scanUrl} size={320} className="shadow-glow" />
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-3">
        <Icon name="pending" size={20} className="text-brand-300" />
        <span className="text-lg font-semibold tabular-nums">
          {secondsLeft > 0 ? `${secondsLeft} sn` : "Yenileniyor…"}
        </span>
      </div>

      <p className="mt-8 max-w-md text-center text-xs text-slate-500">
        Kod yaklaşık 30 saniyede bir yenilenir. Ekranı projeksiyona yansıtabilirsiniz.
      </p>
    </div>
  );
}
