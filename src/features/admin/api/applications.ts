// Kulüp başvuruları — okuma `application.view`, karar `club.approve` (§5.2)
import { apiClient } from "@/shared/api/client";
import type {
  ApiEnvelope,
  Club,
  ClubApplication,
  ClubApplicationApproval,
  ClubApplicationHistory,
  ClubApplicationRevisionRequest,
  SafeUser,
} from "@/shared/types";
import { adminBase } from "./_base";

/** Admin başvuru listesinde başvuran + onay zinciri gömülü gelir (§5.2). */
export type AdminClubApplication = ClubApplication & {
  applicant?: SafeUser;
  approvals?: ClubApplicationApproval[];
};

/** GET tekil başvuru — onay zinciri, revizyon talebi ve başvuran gömülü. */
export type AdminClubApplicationDetail = AdminClubApplication & {
  approvals: ClubApplicationApproval[];
  revisionRequest?: ClubApplicationRevisionRequest | null;
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

export const getClubApplication = async (
  universityId: string,
  applicationId: string
): Promise<AdminClubApplicationDetail> => {
  const response = await apiClient.get<ApiEnvelope<AdminClubApplicationDetail>>(
    `${adminBase(universityId)}/club-applications/${applicationId}`
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

export const requestClubApplicationRevision = async (
  universityId: string,
  applicationId: string,
  body: { note: string }
): Promise<void> => {
  await apiClient.patch(
    `${adminBase(universityId)}/club-applications/${applicationId}/request-revision`,
    body
  );
};

export const getClubApplicationHistory = async (
  universityId: string,
  applicationId: string
): Promise<ClubApplicationHistory> => {
  const response = await apiClient.get<ApiEnvelope<ClubApplicationHistory>>(
    `${adminBase(universityId)}/club-applications/${applicationId}/history`
  );
  return response.data.data;
};
