import { useState } from "react";
import QrCodeDisplay from "@/shared/ui/QrCodeDisplay";
import { posterQrScanUrl } from "@/shared/lib/qrUrls";
import type { PosterQrCode } from "@/shared/types";
import { POSTER_QR_TARGET_LABELS } from "@/features/poster-qr/labels";

interface PosterQrPrintSheetProps {
  qr: PosterQrCode;
  targetLabel: string;
  universityName?: string;
  onClose: () => void;
}

export default function PosterQrPrintSheet({
  qr,
  targetLabel,
  universityName,
  onClose,
}: PosterQrPrintSheetProps) {
  const [paper, setPaper] = useState<"A4" | "A5">("A4");
  const scanUrl = posterQrScanUrl(qr.code);
  const qrSize = paper === "A5" ? 180 : 240;

  const handlePrint = () => {
    document.body.dataset.posterQrPaper = paper;
    document.body.classList.add("printing-poster-qr");
    window.print();
    document.body.classList.remove("printing-poster-qr");
    delete document.body.dataset.posterQrPaper;
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm print:hidden">
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">Yazdırılabilir afiş</h3>
            <p className="mt-1 text-sm text-slate-500">
              A4 veya A5&apos;e basılabilir. Ekran görüntüsü almanıza gerek yok.
            </p>
          </div>
          <button type="button" className="btn-ghost text-xs" onClick={onClose}>
            Kapat
          </button>
        </div>

        <div className={`poster-qr-print-sheet poster-qr-print-${paper.toLowerCase()} mx-auto`}>
          {universityName && (
            <p className="text-center text-sm font-semibold text-slate-600">{universityName}</p>
          )}
          <h2 className="text-center font-display text-xl font-extrabold text-slate-900">
            {qr.sourceLabel}
          </h2>
          <div className="flex justify-center py-4">
            <QrCodeDisplay value={scanUrl} size={qrSize} />
          </div>
          <p className="text-center text-sm text-slate-700">
            <strong>{POSTER_QR_TARGET_LABELS[qr.targetType]}:</strong> {targetLabel}
          </p>
          <p className="mt-3 text-center text-xs text-slate-500">
            Telefonunuzla QR kodu okutun. Afiş basıldıktan sonra hedef değiştirilebilir; aynı QR
            geçerli kalır.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <select
            className="input-field py-1.5 text-xs"
            value={paper}
            onChange={(e) => setPaper(e.target.value as "A4" | "A5")}
          >
            <option value="A4">A4</option>
            <option value="A5">A5</option>
          </select>
          <button type="button" className="btn-primary" onClick={handlePrint}>
            Yazdır
          </button>
        </div>
      </div>

      {/* Yalnızca yazdırma sırasında görünür */}
      <div className="poster-qr-print-only hidden">
        {universityName && <p className="text-center text-sm font-semibold">{universityName}</p>}
        <h1 className="text-center font-display text-2xl font-extrabold">{qr.sourceLabel}</h1>
        <div className="flex justify-center py-6">
          <QrCodeDisplay value={scanUrl} size={paper === "A5" ? 220 : 280} quietZone />
        </div>
        <p className="text-center text-base">
          {POSTER_QR_TARGET_LABELS[qr.targetType]}: {targetLabel}
        </p>
        <p className="mt-4 text-center text-sm text-slate-600">
          QR kodu okutarak güncel sayfaya ulaşın.
        </p>
      </div>
    </div>
  );
}
