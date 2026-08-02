import { apiClient } from "@/shared/api/client";
import type { ApiEnvelope, CreatePlatformUserDto, PlatformUserListItem } from "@/shared/types";

export const listPlatformUsers = async (): Promise<PlatformUserListItem[]> => {
  const response = await apiClient.get<ApiEnvelope<PlatformUserListItem[]>>("/platform/users");
  return response.data.data;
};

export const createPlatformUser = async (
  dto: CreatePlatformUserDto,
): Promise<PlatformUserListItem> => {
  const response = await apiClient.post<ApiEnvelope<PlatformUserListItem>>("/platform/users", dto);
  return response.data.data;
};
