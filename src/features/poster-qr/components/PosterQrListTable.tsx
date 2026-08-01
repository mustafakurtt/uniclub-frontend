import {
  effectivePosterQrStatus,
  POSTER_QR_STATUS_CHIP,
  POSTER_QR_STATUS_LABELS,
  POSTER_QR_TARGET_LABELS,
} from "@/features/poster-qr/labels";
import type { PosterQrCode } from "@/shared/types";

interface PosterQrListTableProps {
  codes: PosterQrCode[];
  resolveTargetLabel: (qr: PosterQrCode) => string;
  onPrint: (qr: PosterQrCode) => void;
  onRetarget: (qr: PosterQrCode) => void;
  onCancel: (qr: PosterQrCode) => void;
  onAnalytics: (qr: PosterQrCode) => void;
}

export default function PosterQrListTable({
  codes,
  resolveTargetLabel,
  onPrint,
  onRetarget,
  onCancel,
  onAnalytics,
}: PosterQrListTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            <th className="py-2 pr-3">Kaynak</th>
            <th className="py-2 pr-3">Hedef</th>
            <th className="py-2 pr-3">Durum</th>
            <th className="py-2 pr-3">Tarama</th>
            <th className="py-2 text-right">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {codes.map((qr) => {
            const status = effectivePosterQrStatus(qr);
            return (
              <tr key={qr.id} className="border-b border-slate-50">
                <td className="py-3 pr-3 font-semibold text-slate-800">{qr.sourceLabel}</td>
                <td className="py-3 pr-3 text-slate-600">
                  <span className="text-xs text-slate-400">
                    {POSTER_QR_TARGET_LABELS[qr.targetType]}
                  </span>
                  <br />
                  {resolveTargetLabel(qr)}
                </td>
                <td className="py-3 pr-3">
                  <span className={`chip text-xs ${POSTER_QR_STATUS_CHIP[status]}`}>
                    {POSTER_QR_STATUS_LABELS[status]}
                  </span>
                </td>
                <td className="py-3 pr-3 text-slate-500 tabular-nums">{qr.scanCount}</td>
                <td className="py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-1">
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      onClick={() => onAnalytics(qr)}
                    >
                      Analitik
                    </button>
                    <button type="button" className="btn-ghost text-xs" onClick={() => onPrint(qr)}>
                      Yazdır
                    </button>
                    {status !== "cancelled" && (
                      <>
                        <button
                          type="button"
                          className="btn-ghost text-xs"
                          onClick={() => onRetarget(qr)}
                        >
                          Hedefi Değiştir
                        </button>
                        <button
                          type="button"
                          className="btn-ghost text-xs text-red-600"
                          onClick={() => onCancel(qr)}
                        >
                          İptal
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
