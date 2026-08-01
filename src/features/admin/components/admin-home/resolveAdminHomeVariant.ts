import type { GlobalPermission, RoleName } from "@/shared/types";
import { isPlatformRole } from "@/features/auth/authorization";

export type AdminHomeVariant = "tenant" | "workQueue" | "moderation" | "audit" | "generic";

const ROLE_VARIANT_PRIORITY: { roles: RoleName[]; variant: AdminHomeVariant }[] = [
  { roles: ["super_admin", "platform_support", "university_admin"], variant: "tenant" },
  { roles: ["student_affairs", "academic_affairs"], variant: "workQueue" },
  { roles: ["content_moderator"], variant: "moderation" },
  { roles: ["auditor"], variant: "audit" },
];

/**
 * Rol bazlı iniş görünümü — çoklu rolde öncelik sırası + maxRank yedek kuralı.
 * Sert yönlendirme yok; yalnızca /admin varsayılan içeriğini belirler.
 */
export function resolveAdminHomeVariant(
  roleNames: RoleName[],
  maxRank: number,
  hasPermission: (p: GlobalPermission) => boolean
): AdminHomeVariant {
  for (const entry of ROLE_VARIANT_PRIORITY) {
    if (entry.roles.some((r) => roleNames.includes(r))) return entry.variant;
  }

  if (maxRank >= 60 || isPlatformRole(roleNames)) return "tenant";
  if (maxRank >= 45) return "workQueue";
  if (hasPermission("announcement.moderate") || hasPermission("gallery.moderate")) {
    return "moderation";
  }
  if (hasPermission("audit.view")) return "audit";

  return "generic";
}
