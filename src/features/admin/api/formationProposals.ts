// Kuruluş önerileri — SKS yüzeyi (FRONTEND_CLUB_FORMATION.md §4)
import { apiClient } from "@/shared/api/client";
import type {
  AdminFormationProposalDetail,
  ApiEnvelope,
  FormationProposal,
  FormationProposalStatus,
} from "@/shared/types";
import { adminBase } from "./_base";

export const getAdminFormationProposals = async (
  universityId: string,
  status?: FormationProposalStatus
): Promise<FormationProposal[]> => {
  const response = await apiClient.get<ApiEnvelope<FormationProposal[]>>(
    `${adminBase(universityId)}/formation-proposals`,
    { params: status ? { status } : undefined }
  );
  return response.data.data;
};

export const getAdminFormationProposal = async (
  universityId: string,
  proposalId: string
): Promise<AdminFormationProposalDetail> => {
  const response = await apiClient.get<ApiEnvelope<AdminFormationProposalDetail>>(
    `${adminBase(universityId)}/formation-proposals/${proposalId}`
  );
  return response.data.data;
};
