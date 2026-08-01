import type { GlobalPermission, RoleName } from "@/shared/types";
import {
  CLUB_PERMISSIONS,
  isPlatformRole,
  MODERATION_PERMISSIONS,
  UNIVERSITY_PERMISSIONS,
} from "@/features/auth/authorization";

export type AdminHomeVariant =
  | "tenant"
  | "workQueue"
  | "moderation"
  | "audit"
  | "structure"
  | "generic";

type VariantRule = {
  variant: AdminHomeVariant;
  canShow: (hasPermission: (p: GlobalPermission) => boolean, maxRank: number) => boolean;
};

const VARIANT_RULES: VariantRule[] = [
  {
    variant: "tenant",
    canShow: (hasPermission, maxRank) =>
      maxRank >= 60 || hasPermission("university.settings.manage"),
  },
  {
    variant: "workQueue",
    canShow: (hasPermission) => hasPermission("application.view"),
  },
  {
    variant: "moderation",
    canShow: (hasPermission) =>
      hasPermission("club.view") && MODERATION_PERMISSIONS.some((p) => hasPermission(p)),
  },
  {
    variant: "audit",
    canShow: (hasPermission) => hasPermission("audit.view"),
  },
  {
    variant: "structure",
    canShow: (hasPermission) =>
      hasPermission("user.view") || UNIVERSITY_PERMISSIONS.some((p) => hasPermission(p)),
  },
];

/**
 * Yetenek tabanlı iniş görünümü — rol adı değil, etkin yetkiler belirler.
 * Sert yönlendirme yok; yalnızca /admin varsayılan içeriğini belirler.
 */
export function resolveAdminHomeVariant(
  roleNames: RoleName[],
  maxRank: number,
  hasPermission: (p: GlobalPermission) => boolean
): AdminHomeVariant {
  if (isPlatformRole(roleNames)) return "tenant";

  for (const rule of VARIANT_RULES) {
    if (rule.canShow(hasPermission, maxRank)) return rule.variant;
  }

  if (CLUB_PERMISSIONS.some((p) => hasPermission(p))) return "generic";

  return "generic";
}
