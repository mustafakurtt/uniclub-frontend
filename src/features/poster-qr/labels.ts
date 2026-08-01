import type { PosterQrCode, PosterQrResolveStatus } from "@/shared/types";

export type PosterQrEffectiveStatus = PosterQrResolveStatus;

export const POSTER_QR_STATUS_LABELS: Record<PosterQrEffectiveStatus, string> = {
  active: "Aktif",
  expired: "Süresi doldu",
  cancelled: "İptal edildi",
  not_yet_active: "Henüz başlamadı",
};

export const POSTER_QR_STATUS_CHIP: Record<PosterQrEffectiveStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  expired: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-50 text-red-700",
  not_yet_active: "bg-amber-50 text-amber-700",
};

export const POSTER_QR_TARGET_LABELS = {
  club: "Kulüp sayfası",
  activity: "Etkinlik",
} as const;

/** DB satırından kullanıcıya gösterilecek efektif durum. */
export function effectivePosterQrStatus(row: PosterQrCode): PosterQrEffectiveStatus {
  if (row.status === "cancelled") return "cancelled";
  const now = Date.now();
  if (row.validFrom && new Date(row.validFrom).getTime() > now) return "not_yet_active";
  if (row.validUntil && new Date(row.validUntil).getTime() < now) return "expired";
  return "active";
}

export const POSTER_QR_RESOLVE_MESSAGES: Record<Exclude<PosterQrResolveStatus, "active">, string> = {
  expired: "Bu afiş kampanyasının süresi doldu. Güncel bilgi için kulübünüze veya okul panosuna bakın.",
  cancelled: "Bu afiş kampanyası iptal edildi.",
  not_yet_active: "Bu afiş kampanyası henüz başlamadı. Lütfen daha sonra tekrar deneyin.",
};
