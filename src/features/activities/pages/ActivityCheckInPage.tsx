import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BrowserQRCodeReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { checkInActivity, getActivity } from "@/features/activities/api/activities";
import { parseCheckInToken } from "@/shared/lib/qrUrls";
import { getErrorMessage } from "@/shared/api/client";
import PageLoader from "@/shared/ui/PageLoader";
import { Icon } from "@/shared/ui/Icon";

type ScanState = "idle" | "camera" | "denied";

export default function ActivityCheckInPage() {
  const { activityId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const [manualToken, setManualToken] = useState(searchParams.get("token") ?? "");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);

  const activityQuery = useQuery({
    queryKey: ["activities", activityId],
    queryFn: () => getActivity(activityId),
    enabled: !!activityId,
  });

  const checkInMutation = useMutation({
    mutationFn: (token: string) => checkInActivity(activityId, token),
    onMutate: () => ({
      priorCheckedIn: activityQuery.data?.myRsvp?.checkedInAt ?? null,
    }),
    onSuccess: (_data, _token, context) => {
      queryClient.invalidateQueries({ queryKey: ["activities", activityId] });
      if (context?.priorCheckedIn) {
        setAlreadyCheckedIn(true);
        setSuccessMessage("Zaten kayıtlısın — yoklaman daha önce alınmış.");
      } else {
        setSuccessMessage("Yoklaman alındı. İyi etkinlikler!");
      }
    },
  });

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanState("idle");
  }, []);

  const submitToken = useCallback(
    (raw: string) => {
      const token = parseCheckInToken(raw, activityId);
      if (!token) return;
      setManualToken(token);
      checkInMutation.mutate(token);
    },
    [activityId, checkInMutation]
  );

  useEffect(() => {
    const initial = searchParams.get("token");
    if (initial) submitToken(initial);
  }, [searchParams, submitToken]);

  const startCamera = async () => {
    if (!videoRef.current) return;
    try {
      const reader = new BrowserQRCodeReader();
      setScanState("camera");
      const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (result) {
          stopCamera();
          submitToken(result.getText());
        }
      });
      controlsRef.current = controls;
    } catch {
      setScanState("denied");
    }
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  if (activityQuery.isLoading) {
    return <PageLoader label="Etkinlik yükleniyor…" />;
  }

  const activity = activityQuery.data;
  const checkInError = checkInMutation.isError
    ? getErrorMessage(checkInMutation.error, "Yoklama alınamadı.")
    : null;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        to={`/activities/${activityId}`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-700"
      >
        <Icon name="arrowLeft" size={16} /> Etkinliğe Dön
      </Link>

      <div className="card p-6">
        <h1 className="font-display text-xl font-extrabold text-slate-900">Yoklama</h1>
        <p className="mt-1 text-sm text-slate-500">{activity?.title}</p>

        {(successMessage || alreadyCheckedIn) && (
          <div className="alert-success mt-4">
            {successMessage ?? "Zaten kayıtlısın — yoklaman daha önce alınmış."}
          </div>
        )}

        {checkInError && !alreadyCheckedIn && (
          <div className="alert-error mt-4">{checkInError}</div>
        )}

        {!activity?.myRsvp && !successMessage && (
          <div className="alert-error mt-4">
            Bu etkinlik için önce katılım (RSVP) bildirmeniz gerekir. Etkinlik sayfasından
            &quot;Katılıyorum&quot; seçeneğini işaretleyin.
          </div>
        )}

        <div className="mt-6 space-y-4">
          {scanState === "camera" ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
              <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
            </div>
          ) : (
            <button
              type="button"
              className="btn-secondary w-full"
              disabled={!activity?.myRsvp || checkInMutation.isPending}
              onClick={() => void startCamera()}
            >
              <Icon name="scan" size={16} /> Kamera ile Tara
            </button>
          )}

          {scanState === "denied" && (
            <p className="text-xs text-amber-700">
              Kamera izni verilmedi veya cihaz desteklenmiyor. Aşağıdan kodu elle girebilirsiniz.
            </p>
          )}

          {scanState === "camera" && (
            <button type="button" className="btn-ghost w-full text-xs" onClick={stopCamera}>
              Kamerayı Kapat
            </button>
          )}

          <div>
            <label className="input-label" htmlFor="manualToken">
              Kodu elle gir
            </label>
            <div className="flex gap-2">
              <input
                id="manualToken"
                className="input-field flex-1 font-mono text-sm"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Yoklama kodu"
                disabled={!activity?.myRsvp}
              />
              <button
                type="button"
                className="btn-primary shrink-0"
                disabled={!activity?.myRsvp || !manualToken.trim() || checkInMutation.isPending}
                onClick={() => submitToken(manualToken)}
              >
                Onayla
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Projeksiyondaki QR kodu okutamazsanız, ekrandaki kodu buraya yapıştırabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
