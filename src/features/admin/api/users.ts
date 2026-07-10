// Kullanıcı yönetimi — okuma `user.view`, yazma `user.manage` (§5.1)
import { apiClient } from "@/shared/api/client";
import type {
  AdminUserDetail,
  AdminUserListItem,
  ApiEnvelope,
  EffectivePermissions,
  RoleName,
  SafeUser,
  UserStatus,
} from "@/shared/types";
import { adminBase } from "./_base";

/** Liste — her satırda global `roles` gömülü. `status`/`role` ile filtrelenebilir. */
export const getAdminUsers = async (
  universityId: string,
  params?: { status?: UserStatus; role?: RoleName }
): Promise<AdminUserListItem[]> => {
  const response = await apiClient.get<ApiEnvelope<AdminUserListItem[]>>(
    `${adminBase(universityId)}/users`,
    { params }
  );
  return response.data.data;
};

/** Zenginleştirilmiş detay: roller + kulüp üyelikleri + override'lar + effective. */
export const getAdminUser = async (
  universityId: string,
  userId: string
): Promise<AdminUserDetail> => {
  const response = await apiClient.get<ApiEnvelope<AdminUserDetail>>(
    `${adminBase(universityId)}/users/${userId}`
  );
  return response.data.data;
};

/** Bir kullanıcının etkin yetkilerini yönetici gözüyle görme (`user.view`). */
export const getUserEffectivePermissions = async (
  universityId: string,
  userId: string
): Promise<EffectivePermissions> => {
  const response = await apiClient.get<ApiEnvelope<EffectivePermissions>>(
    `${adminBase(universityId)}/users/${userId}/effective-permissions`
  );
  return response.data.data;
};

export const updateUserStatus = async (
  universityId: string,
  userId: string,
  status: UserStatus
): Promise<SafeUser> => {
  const response = await apiClient.patch<ApiEnvelope<SafeUser>>(
    `${adminBase(universityId)}/users/${userId}/status`,
    { status }
  );
  return response.data.data;
};

export const updateUserDepartment = async (
  universityId: string,
  userId: string,
  departmentId: string | null
): Promise<SafeUser> => {
  const response = await apiClient.patch<ApiEnvelope<SafeUser>>(
    `${adminBase(universityId)}/users/${userId}/department`,
    { departmentId }
  );
  return response.data.data;
};
