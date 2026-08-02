import type {
  PlatformAccountRoleName,
  TenantAdminInvitationStatus,
  UniversityLifecycleStatus,
} from "@/shared/types";
import { roleLabel } from "@/features/admin/labels";

export const TENANT_STATUS_LABELS: Record<UniversityLifecycleStatus, string> = {
  trial: "Deneme",
  active: "Aktif",
  past_due: "Ödeme gecikmiş",
  suspended: "Askıda",
};

export const TENANT_STATUS_CHIP: Record<UniversityLifecycleStatus, string> = {
  trial: "bg-sky-50 text-sky-700",
  active: "bg-emerald-50 text-emerald-700",
  past_due: "bg-amber-50 text-amber-800",
  suspended: "bg-red-50 text-red-700",
};

export const INVITATION_STATUS_LABELS: Record<TenantAdminInvitationStatus, string> = {
  pending: "Bekliyor",
  accepted: "Kullanıldı",
  cancelled: "İptal",
  expired: "Süresi doldu",
};

export const INVITATION_STATUS_CHIP: Record<TenantAdminInvitationStatus, string> = {
  pending: "bg-violet-50 text-violet-700",
  accepted: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-600",
  expired: "bg-amber-50 text-amber-800",
};

export const DOMAIN_TYPE_LABELS = {
  student: "Öğrenci (@std…)",
  staff: "Personel / yönetici",
} as const;

export const PLATFORM_ROLE_LABELS: Record<PlatformAccountRoleName, string> = {
  super_admin: roleLabel("super_admin"),
  platform_support: roleLabel("platform_support"),
};
