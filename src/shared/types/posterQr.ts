// Afiş QR — docs/architecture/FRONTEND_KAMUYA_ACIK.md, API.md §15.

export type PosterQrDbStatus = "active" | "cancelled";
export type PosterQrTargetType = "club" | "activity";
export type PosterQrResolveStatus = "active" | "expired" | "cancelled" | "not_yet_active";

export type PosterQrActiveTarget =
  | { type: "club"; universitySlug: string; clubSlug: string }
  | { type: "activity"; universitySlug: string; activityId: string };

export type PosterQrResolveResult =
  | { status: "active"; target: PosterQrActiveTarget }
  | { status: Exclude<PosterQrResolveStatus, "active"> };

export interface PosterQrCode {
  id: string;
  code: string;
  status: PosterQrDbStatus;
  sourceLabel: string;
  targetType: PosterQrTargetType;
  targetClubId: string | null;
  targetActivityId: string | null;
  validFrom: string | null;
  validUntil: string | null;
  scanCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePosterQrDto {
  sourceLabel: string;
  targetType: PosterQrTargetType;
  targetClubId?: string;
  targetActivityId?: string;
  validFrom?: string | null;
  validUntil?: string | null;
}

export interface UpdatePosterQrDto {
  sourceLabel?: string;
  targetType?: PosterQrTargetType;
  targetClubId?: string | null;
  targetActivityId?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
}
