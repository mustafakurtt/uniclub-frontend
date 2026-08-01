// Kulüp üyelik tarihçesi — GET /api/clubs/:clubId/membership-history
// (docs/architecture/FRONTEND_CLUBS.md §7.6)
import { apiClient } from "@/shared/api/client";
import type { ApiEnvelope, MembershipHistoryPage } from "@/shared/types";

export interface ListMembershipHistoryParams {
  limit?: number;
  cursor?: string;
  academicTermId?: string;
}

export const getMembershipHistory = async (
  clubId: string,
  params: ListMembershipHistoryParams = {}
): Promise<MembershipHistoryPage> => {
  const response = await apiClient.get<ApiEnvelope<MembershipHistoryPage>>(
    `/clubs/${clubId}/membership-history`,
    { params }
  );
  return response.data.data;
};
