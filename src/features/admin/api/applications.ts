// Kulüp başvuruları — okuma `application.view`, karar `club.approve` (§5.2)
import { apiClient } from "@/shared/api/client";
import type { ApiEnvelope, Club, ClubApplication, ClubApplicationApproval, SafeUser } from "@/shared/types";
import { adminBase } from "./_base";

/** Admin başvuru listesinde başvuran + onay zinciri gömülü gelir (§5.2). */
export type AdminClubApplication = ClubApplication & {
  applicant?: SafeUser;
  approvals?: ClubApplicationApproval[];
};

export const getClubApplications = async (
  universityId: string,
  status?: ClubApplication["status"]
): Promise<AdminClubApplication[]> => {
  const response = await apiClient.get<ApiEnvelope<AdminClubApplication[]>>(
    `${adminBase(universityId)}/club-applications`,
    { params: status ? { status } : undefined }
  );
  return response.data.data;
};

/** Onay GERÇEK kulüp oluşturur; başvuran otomatik başkan olur (§11). */
export const approveClubApplication = async (
  universityId: string,
  applicationId: string,
  body?: { note?: string }
): Promise<Club> => {
  const response = await apiClient.patch<ApiEnvelope<Club>>(
    `${adminBase(universityId)}/club-applications/${applicationId}/approve`,
    body ?? {}
  );
  return response.data.data;
};

export const rejectClubApplication = async (
  universityId: string,
  applicationId: string,
  body: { note: string }
): Promise<void> => {
  await apiClient.patch(
    `${adminBase(universityId)}/club-applications/${applicationId}/reject`,
    body
  );
};
