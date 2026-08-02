import type { UniversityLifecycleStatus } from "@/shared/types";

export interface TenantStatusAction {
  status: UniversityLifecycleStatus;
  label: string;
  destructive?: boolean;
}

const ALLOWED: Record<UniversityLifecycleStatus, UniversityLifecycleStatus[]> = {
  trial: ["active", "suspended"],
  active: ["past_due", "suspended"],
  past_due: ["active", "suspended"],
  suspended: ["active"],
};

const ACTION_LABELS: Record<UniversityLifecycleStatus, string> = {
  trial: "Deneme",
  active: "Aktif yap",
  past_due: "Ödeme gecikmiş işaretle",
  suspended: "Askıya al",
};

export function tenantStatusActions(
  current: UniversityLifecycleStatus,
): TenantStatusAction[] {
  return ALLOWED[current].map((status) => ({
    status,
    label: ACTION_LABELS[status],
    destructive: status === "suspended",
  }));
}
