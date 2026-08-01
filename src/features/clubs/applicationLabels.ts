import type {
  ApplicationStatus,
  ClubApplicationEventType,
} from "@/shared/types";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "Değerlendiriliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  revision_requested: "Düzeltme bekleniyor",
};

export const APPLICATION_STATUS_CHIP: Record<ApplicationStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  approved: "bg-green-50 text-green-700 border-green-100",
  rejected: "bg-red-50 text-red-700 border-red-100",
  revision_requested: "bg-violet-50 text-violet-700 border-violet-100",
};

export const APPLICATION_EVENT_LABELS: Record<ClubApplicationEventType, string> = {
  revision_requested: "Revizyon talep edildi",
  resubmitted: "Yeniden gönderildi",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

export const APPLICATION_EVENT_CHIP: Record<ClubApplicationEventType, string> = {
  revision_requested: "bg-violet-50 text-violet-700 border-violet-100",
  resubmitted: "bg-sky-50 text-sky-700 border-sky-100",
  approved: "bg-green-50 text-green-700 border-green-100",
  rejected: "bg-red-50 text-red-700 border-red-100",
};
