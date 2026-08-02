import type { GlobalPermission } from "@/shared/types";
import {
  CLUB_PERMISSIONS,
  MODERATION_PERMISSIONS,
  UNIVERSITY_PERMISSIONS,
} from "@/features/auth/authorization";

export interface AdminQuickLink {
  to: string;
  label: string;
}

export function buildAdminQuickLinks(
  hasPermission: (permission: GlobalPermission) => boolean,
  options?: { committeeTasks?: boolean }
): AdminQuickLink[] {
  const links: AdminQuickLink[] = [];

  if (options?.committeeTasks) {
    links.push({ to: "/admin/committee-tasks", label: "Kurul görevlerim" });
  }
  if (hasPermission("user.view")) {
    links.push({ to: "/admin/users", label: "Kullanıcılar" });
  }
  if (CLUB_PERMISSIONS.some((p) => hasPermission(p))) {
    links.push({ to: "/admin/clubs", label: "Kulüp yönetimi" });
  }
  if (hasPermission("club.view") && MODERATION_PERMISSIONS.some((p) => hasPermission(p))) {
    links.push({ to: "/admin/moderation", label: "Moderasyon" });
  }
  if (hasPermission("announcement.university.manage")) {
    links.push({ to: "/admin/university-announcements", label: "Okul duyuruları" });
  }
  if (hasPermission("platform.tenant.view")) {
    links.push({ to: "/admin/platform/tenants", label: "Platform tenantları" });
  }
  if (hasPermission("platform.user.view")) {
    links.push({ to: "/admin/platform/users", label: "Platform operatörleri" });
  }
  if (UNIVERSITY_PERMISSIONS.some((p) => hasPermission(p))) {
    links.push({ to: "/admin/universities", label: "Akademik yapı" });
  }
  if (hasPermission("university.academic_term.manage")) {
    links.push({ to: "/admin/academic-terms", label: "Akademik dönemler" });
  }
  if (hasPermission("university.settings.manage")) {
    links.push({ to: "/admin/settings", label: "Politikalar" });
    links.push({ to: "/admin/approval-committees", label: "Onay kurulları" });
  }
  if (hasPermission("audit.view")) {
    links.push({ to: "/admin/audit", label: "Denetim izi" });
  }
  if (hasPermission("university.export.generate")) {
    links.push({ to: "/admin/exports", label: "Raporlar" });
  }
  if (hasPermission("role.manage")) {
    links.push({ to: "/admin/roles", label: "Roller" });
  }
  if (hasPermission("permission.manage")) {
    links.push({ to: "/admin/permissions", label: "Yetkiler" });
  }

  return links;
}
