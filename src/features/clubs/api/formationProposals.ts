// Kuruluş önerisi — öğrenci yüzeyi (FRONTEND_CLUB_FORMATION.md §1)
import { apiClient } from "@/shared/api/client";
import type { ApiEnvelope, FormationProposal, FormationProposalDetail } from "@/shared/types";

export const getFormationProposals = async (): Promise<FormationProposal[]> => {
  const response = await apiClient.get<ApiEnvelope<FormationProposal[]>>(
    "/clubs/formation-proposals"
  );
  return response.data.data.map((p) => ({ ...p, hasSupported: p.hasSupported ?? false }));
};

export const getFormationProposal = async (proposalId: string): Promise<FormationProposalDetail> => {
  const response = await apiClient.get<ApiEnvelope<FormationProposalDetail>>(
    `/clubs/formation-proposals/${proposalId}`
  );
  const data = response.data.data;
  return { ...data, hasSupported: data.hasSupported ?? false };
};

export const supportFormationProposal = async (proposalId: string): Promise<void> => {
  await apiClient.post(`/clubs/formation-proposals/${proposalId}/support`);
};

export const withdrawFormationSupport = async (proposalId: string): Promise<void> => {
  await apiClient.delete(`/clubs/formation-proposals/${proposalId}/support`);
};

export const withdrawFormationProposal = async (proposalId: string): Promise<void> => {
  await apiClient.delete(`/clubs/formation-proposals/${proposalId}`);
};
