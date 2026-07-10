// RBAC yönetimi — /api/auth (docs/FRONTEND_YONETIM.md §6).
//
// Tenant scope path'te DEĞİLDİR; kapsam serviste aktör rolüne göre uygulanır:
//   • super_admin  → sınırsız (global roller + tüm tenant'lar),
//   • university_admin (`role.manage`) → yalnızca kendi tenant'ının rolleri;
//     platform rolleri/yetkileri atayamaz (backend zorlar, §6.1/§6.2).
// permission.manage (yetki kataloğu + kişisel claim) yalnızca super_admin'dedir.
import { apiClient } from "@/shared/api/client";
import type {
  ApiEnvelope,
  Permission,
  PermissionOverride,
  Role,
  RoleWithPermissions,
  SafeUser,
} from "@/shared/types";

// ---------------------------------------------------------------------------
// 6.1 — Kullanıcıya rol atama (`role.manage`)
// ---------------------------------------------------------------------------

export const getUserRoles = async (userId: string): Promise<Role[]> => {
  const response = await apiClient.get<ApiEnvelope<Role[]>>(`/auth/users/${userId}/roles`);
  return response.data.data;
};

export const assignUserRole = async (userId: string, roleId: string): Promise<void> => {
  await apiClient.post(`/auth/users/${userId}/roles`, { roleId });
};

export const removeUserRole = async (userId: string, roleId: string): Promise<void> => {
  await apiClient.delete(`/auth/users/${userId}/roles/${roleId}`);
};

// promote/demote — role adı kısayolları (URL geriye dönük uyumluluk için "admin"
// kaldı ama artık `university_admin` rolüne atar). super_admin işlemlerini UI'da
// yalnızca super_admin aktöre göster (aksi halde backend 400 döner, §6.1).
export const promoteToUniversityAdmin = async (userId: string): Promise<void> => {
  await apiClient.patch(`/auth/users/${userId}/promote-admin`);
};
export const demoteUniversityAdmin = async (userId: string): Promise<void> => {
  await apiClient.patch(`/auth/users/${userId}/demote-admin`);
};
export const promoteToSuperAdmin = async (userId: string): Promise<void> => {
  await apiClient.patch(`/auth/users/${userId}/promote-super-admin`);
};
export const demoteSuperAdmin = async (userId: string): Promise<void> => {
  await apiClient.patch(`/auth/users/${userId}/demote-super-admin`);
};

// ---------------------------------------------------------------------------
// 6.2 — Rol kataloğu (`role.manage`)
// ---------------------------------------------------------------------------

export interface CreateRoleDto {
  name: string;
  description?: string;
  /** university_admin çağırırsa backend kendi tenant'ına zorlar (§6.2). */
  universityId?: string;
  /**
   * Yetki derecesi 0–100; verilmezse 0. Yalnızca KENDİ maxRank'inden düşük bir
   * rütbe verilebilir (FRONTEND_RUTBE_VE_PLATFORM.md §3).
   */
  rank?: number;
}

export const getRoles = async (): Promise<RoleWithPermissions[]> => {
  const response = await apiClient.get<ApiEnvelope<RoleWithPermissions[]>>("/auth/roles");
  return response.data.data;
};

export const createRole = async (dto: CreateRoleDto): Promise<Role> => {
  const response = await apiClient.post<ApiEnvelope<Role>>("/auth/roles", dto);
  return response.data.data;
};

/** Çekirdek rollerin adı VE rütbesi değiştirilemez (backend 400 döner, §3). */
export const updateRole = async (
  roleId: string,
  dto: { name?: string; description?: string; rank?: number }
): Promise<Role> => {
  const response = await apiClient.patch<ApiEnvelope<Role>>(`/auth/roles/${roleId}`, dto);
  return response.data.data;
};

export const deleteRole = async (roleId: string): Promise<void> => {
  await apiClient.delete(`/auth/roles/${roleId}`);
};

export const getRoleUsers = async (roleId: string): Promise<SafeUser[]> => {
  const response = await apiClient.get<ApiEnvelope<SafeUser[]>>(`/auth/roles/${roleId}/users`);
  return response.data.data;
};

export const addRolePermission = async (roleId: string, permissionId: string): Promise<void> => {
  await apiClient.post(`/auth/roles/${roleId}/permissions`, { permissionId });
};

export const removeRolePermission = async (
  roleId: string,
  permissionId: string
): Promise<void> => {
  await apiClient.delete(`/auth/roles/${roleId}/permissions/${permissionId}`);
};

// ---------------------------------------------------------------------------
// 6.3 — Yetki (permission) kataloğu (`permission.manage` — yalnızca super_admin)
// ---------------------------------------------------------------------------

export const getPermissions = async (): Promise<Permission[]> => {
  const response = await apiClient.get<ApiEnvelope<Permission[]>>("/auth/permissions");
  return response.data.data;
};

export const createPermission = async (dto: {
  key: string;
  description?: string;
}): Promise<Permission> => {
  const response = await apiClient.post<ApiEnvelope<Permission>>("/auth/permissions", dto);
  return response.data.data;
};

/** `key` değişmez — yalnızca açıklama güncellenebilir (§6.3). */
export const updatePermission = async (
  permissionId: string,
  dto: { description: string }
): Promise<Permission> => {
  const response = await apiClient.patch<ApiEnvelope<Permission>>(
    `/auth/permissions/${permissionId}`,
    dto
  );
  return response.data.data;
};

export const deletePermission = async (permissionId: string): Promise<void> => {
  await apiClient.delete(`/auth/permissions/${permissionId}`);
};

export const getPermissionRoles = async (permissionId: string): Promise<Role[]> => {
  const response = await apiClient.get<ApiEnvelope<Role[]>>(
    `/auth/permissions/${permissionId}/roles`
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// 6.4 — Kişi bazlı yetki override / claim (`permission.manage` — yalnızca super_admin)
// ---------------------------------------------------------------------------

export const getUserPermissionOverrides = async (
  userId: string
): Promise<PermissionOverride[]> => {
  const response = await apiClient.get<ApiEnvelope<PermissionOverride[]>>(
    `/auth/users/${userId}/permissions`
  );
  return response.data.data;
};

/**
 * Upsert override: granted:true → yetkiyi ekle, granted:false → rolden geleni
 * iptal et. `permissionId` VEYA `key` verilebilir (§6.4).
 */
export const setUserPermissionOverride = async (
  userId: string,
  dto: { permissionId?: string; key?: string; granted: boolean }
): Promise<PermissionOverride> => {
  const response = await apiClient.post<ApiEnvelope<PermissionOverride>>(
    `/auth/users/${userId}/permissions`,
    dto
  );
  return response.data.data;
};

/** Override'ı kaldır → yetki tekrar role göre belirlenir. */
export const removeUserPermissionOverride = async (
  userId: string,
  permissionId: string
): Promise<void> => {
  await apiClient.delete(`/auth/users/${userId}/permissions/${permissionId}`);
};
