// Kullanıcı moderasyonu — /api/moderation (ban/unban/şifre sıfırlama/geçmiş).
// İzinler: yazma `user.manage`, okuma `user.view` (bkz. moderation.permissions.ts).
import { apiClient } from "@/shared/api/client";
import type {
  ApiEnvelope,
  BanUserPayload,
  ModerationHistoryPage,
  PasswordResetResult,
  SafeUser,
} from "@/shared/types";

const moderationUserBase = (universityId: string, userId: string) =>
  `/moderation/universities/${universityId}/users/${userId}`;

export const banUser = async (
  universityId: string,
  userId: string,
  body: BanUserPayload
): Promise<SafeUser> => {
  const response = await apiClient.post<ApiEnvelope<SafeUser>>(
    `${moderationUserBase(universityId, userId)}/ban`,
    body
  );
  return response.data.data;
};

export const unbanUser = async (universityId: string, userId: string): Promise<SafeUser> => {
  const response = await apiClient.post<ApiEnvelope<SafeUser>>(
    `${moderationUserBase(universityId, userId)}/unban`
  );
  return response.data.data;
};

export const resetUserPassword = async (
  universityId: string,
  userId: string
): Promise<PasswordResetResult> => {
  const response = await apiClient.post<ApiEnvelope<PasswordResetResult>>(
    `${moderationUserBase(universityId, userId)}/reset-password`
  );
  return response.data.data;
};

export const getUserModerationHistory = async (
  universityId: string,
  userId: string,
  params?: { limit?: number; cursor?: string }
): Promise<ModerationHistoryPage> => {
  const response = await apiClient.get<ApiEnvelope<ModerationHistoryPage>>(
    `${moderationUserBase(universityId, userId)}/moderation-history`,
    { params }
  );
  return response.data.data;
};
