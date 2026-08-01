// Onay kurulları — /api/admin/universities/:uid/approval-committees (FRONTEND_YONETIM.md §5.2)
import { apiClient } from "@/shared/api/client";
import type {
  ApiEnvelope,
  ApprovalCommittee,
  CommitteeVoteDto,
  CommitteeVoteResult,
  CreateApprovalCommitteeDto,
  UpdateApprovalCommitteeDto,
} from "@/shared/types";
import { adminBase } from "./_base";

const committeesBase = (universityId: string) => `${adminBase(universityId)}/approval-committees`;

export const listApprovalCommittees = async (
  universityId: string
): Promise<ApprovalCommittee[]> => {
  const response = await apiClient.get<ApiEnvelope<ApprovalCommittee[]>>(
    committeesBase(universityId)
  );
  return response.data.data;
};

export const getApprovalCommittee = async (
  universityId: string,
  committeeId: string
): Promise<ApprovalCommittee> => {
  const response = await apiClient.get<ApiEnvelope<ApprovalCommittee>>(
    `${committeesBase(universityId)}/${committeeId}`
  );
  return response.data.data;
};

export const createApprovalCommittee = async (
  universityId: string,
  body: CreateApprovalCommitteeDto
): Promise<ApprovalCommittee> => {
  const response = await apiClient.post<ApiEnvelope<ApprovalCommittee>>(
    committeesBase(universityId),
    body
  );
  return response.data.data;
};

export const updateApprovalCommittee = async (
  universityId: string,
  committeeId: string,
  body: UpdateApprovalCommitteeDto
): Promise<ApprovalCommittee> => {
  const response = await apiClient.patch<ApiEnvelope<ApprovalCommittee>>(
    `${committeesBase(universityId)}/${committeeId}`,
    body
  );
  return response.data.data;
};

export const castCommitteeVote = async (
  universityId: string,
  applicationId: string,
  body: CommitteeVoteDto
): Promise<CommitteeVoteResult> => {
  const response = await apiClient.patch<ApiEnvelope<CommitteeVoteResult>>(
    `${adminBase(universityId)}/club-applications/${applicationId}/committee-vote`,
    body
  );
  return response.data.data;
};
