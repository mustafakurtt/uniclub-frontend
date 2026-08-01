// Yönetim / RBAC (Katman A) — docs/FRONTEND_YONETIM.md §3/§4/§5/§6.
// Rolün KENDİSİ ./user.ts'te; burası rolün taşıdığı yetkiler ve yönetim görünümleri.
import type { ClubMembership } from "./club";
import type { Role, RoleName, SafeUser, UserStatus } from "./user";

// Granüler `resource.action` yetkileri. Rol adı gibi liste kapalı değildir.
export type GlobalPermission =
  // Kullanıcı — okuma/yazma ayrı (salt-okunur roller için)
  | "user.view"
  | "user.manage"
  // Kulüp gözetimi — granüler kaynak+aksiyon (FRONTEND_YONETIM.md §3)
  | "club.view"
  | "application.view"
  | "club.approve"
  | "club.update"
  | "club.advisor.manage"
  | "club.member.manage"
  | "club.delete"
  // İçerik moderasyonu (tenant üstten müdahale)
  | "announcement.moderate"
  | "gallery.moderate"
  // University / akademik yapı — granüler (tenant; create/delete platform)
  | "university.create"
  | "university.update"
  | "university.delete"
  | "university.domain.create"
  | "university.domain.update"
  | "university.domain.delete"
  | "university.faculty.create"
  | "university.faculty.update"
  | "university.faculty.delete"
  | "university.department.create"
  | "university.department.update"
  | "university.department.delete"
  | "university.settings.manage"
  | "university.export.generate"
  // RBAC yönetimi (role.manage tenant-scoped; permission.manage platform)
  | "role.manage"
  | "permission.manage"
  // Denetim izi (salt-okunur; docs/DENETIM_VE_HATA.md §1)
  | "audit.view"
  // Afiş QR — okul geneli yönetim (API.md §15)
  | "poster_qr.university.manage"
  | (string & {});

/** Permission kataloğu satırı — GET /api/auth/permissions (§6.3) */
export interface Permission {
  id: string;
  key: GlobalPermission;
  description: string | null;
}

/** Rol + taşıdığı yetkiler — GET /api/auth/roles (§6.2) */
export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

/**
 * Kişi bazlı yetki override satırı (`userPermissions`) — §6.4.
 * granted:true → yetkiyi ekler, granted:false → rolden geleni iptal eder.
 */
export interface PermissionOverride {
  userId: string;
  permissionId: string;
  granted: boolean;
  permission: Permission;
}

/**
 * GET /api/users/me/permissions (ve .../users/:id/effective-permissions) — §4.
 * Rol adına DEĞİL bu `permissions` listesine göre göster/gizle kararı verilir;
 * `roles` yalnızca rozet + çapraz-tenant seçici içindir; `status` hesap durumu.
 */
export interface EffectivePermissions {
  roles: RoleName[];
  permissions: GlobalPermission[];
  status: UserStatus;
  /** Rollerimdeki en yüksek `rank` — aksiyonları önden disable etmek için (§4). */
  maxRank: number;
}

/** GET /api/admin/.../users satırı — safe user + gömülü global roller (§5.1) */
export interface AdminUserListItem extends SafeUser {
  roles: Role[];
}

/** GET /api/admin/.../users/:userId — zenginleştirilmiş detay (§5.1) */
export interface AdminUserDetail extends SafeUser {
  roles: Role[];
  clubMemberships: ClubMembership[];
  permissionOverrides: PermissionOverride[];
  effectivePermissions: GlobalPermission[];
}
