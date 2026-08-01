// Kulüp yüzeyinde ortak Türkçe etiketler + ikon eşlemeleri — tek nokta
// (Dashboard, ClubDetail, admin). İkonlar merkezi kayıttan (Icon.tsx) semantik
// adlarla referanslanır; burada emoji/görsel tutulmaz.
import type {
  AnnouncementStatus,
  AnnouncementVisibility,
  ClubRole,
  ClubStatus,
  ContactPlatform,
  JoinPolicy,
  MembershipHistoryEventType,
  MembershipStatus,
} from "@/shared/types";
import type { IconName } from "@/shared/ui/Icon";

export const CLUB_ROLE_LABELS: Record<ClubRole, string> = {
  member: "Üye",
  officer: "Yönetici",
  president: "Başkan",
};

export const CLUB_ROLE_ICONS: Record<ClubRole, IconName> = {
  member: "member",
  officer: "officer",
  president: "president",
};

export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  pending: "Onay Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

export const CLUB_STATUS_LABELS: Record<ClubStatus, string> = {
  pending: "Onay Bekliyor",
  approved: "Aktif",
  rejected: "Reddedildi",
  archived: "Arşivlendi",
};

export const JOIN_POLICY_LABELS: Record<JoinPolicy, string> = {
  open: "Herkese Açık",
  approval_required: "Onay Gerektirir",
};

export const JOIN_POLICY_ICONS: Record<JoinPolicy, IconName> = {
  open: "policyOpen",
  approval_required: "policyApproval",
};

export const ANNOUNCEMENT_STATUS_LABELS: Record<AnnouncementStatus, string> = {
  draft: "Taslak",
  published: "Yayında",
};

export const SCHEDULED_PUBLISH_LABEL = "Zamanlanmış";

export const ANNOUNCEMENT_VISIBILITY_LABELS: Record<AnnouncementVisibility, string> = {
  university: "Üniversite geneli",
  members: "Yalnızca üyeler",
};

export const CONTACT_PLATFORM_LABELS: Record<ContactPlatform, { label: string; icon: IconName }> = {
  whatsapp: { label: "WhatsApp", icon: "whatsapp" },
  instagram: { label: "Instagram", icon: "instagram" },
  discord: { label: "Discord", icon: "discord" },
  telegram: { label: "Telegram", icon: "telegram" },
  twitter: { label: "Twitter / X", icon: "twitter" },
  website: { label: "Web Sitesi", icon: "website" },
  email: { label: "E-posta", icon: "email" },
  other: { label: "Diğer", icon: "link" },
};

export const MEMBERSHIP_HISTORY_EVENT_LABELS: Record<MembershipHistoryEventType, string> = {
  joined: "Üyeliğe kabul",
  join_rejected: "Katılım isteği reddedildi",
  left: "Kulüpten ayrıldı",
  removed: "Üyelikten çıkarıldı",
  role_changed: "Rol değişti",
};
