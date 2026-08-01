import type { PosterQrTargetType } from "./posterQr";

export interface PosterQrScanBucket {
  day: string;
  count: number;
}

export interface PosterQrScanHourBucket {
  hour: number;
  count: number;
}

export interface PosterQrCodeAnalytics {
  qrId: string;
  sourceLabel: string;
  targetType: PosterQrTargetType;
  targetClubId: string | null;
  targetActivityId: string | null;
  totalScans: number;
  byDay: PosterQrScanBucket[];
  byHour: PosterQrScanHourBucket[];
}

export interface PosterQrSourceRow {
  qrId: string;
  sourceLabel: string;
  scanCount: number;
  status: string;
}

export interface PosterQrTargetSourceComparison {
  targetType: PosterQrTargetType;
  targetClubId: string | null;
  targetActivityId: string | null;
  totalScans: number;
  sources: PosterQrSourceRow[];
}

export interface PosterQrOverviewAnalytics {
  timezone: string;
  targets: PosterQrTargetSourceComparison[];
}
