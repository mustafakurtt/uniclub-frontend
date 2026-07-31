import type { ActivityScope, ActivityStatus, ActivityVisibility, UserRsvpStatus } from "@/shared/types";
import type { IconName } from "@/shared/ui/Icon";

export const ACTIVITY_SCOPE_LABELS: Record<ActivityScope, string> = {
  upcoming: "Yaklaşan",
  past: "Geçmiş",
  all: "Tümü",
};

export const ACTIVITY_VISIBILITY_LABELS: Record<ActivityVisibility, string> = {
  university: "Üniversite geneli",
  members: "Yalnızca üyeler",
};

export const SCHEDULED_PUBLISH_LABEL = "Zamanlanmış";

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  draft: "Taslak",
  published: "Yayında",
  cancelled: "İptal edildi",
};

export const RSVP_STATUS_LABELS: Record<UserRsvpStatus, string> = {
  going: "Katılıyorum",
  interested: "İlgileniyorum",
};

export const RSVP_STATUS_ICONS: Record<UserRsvpStatus, IconName> = {
  going: "check",
  interested: "star",
};
