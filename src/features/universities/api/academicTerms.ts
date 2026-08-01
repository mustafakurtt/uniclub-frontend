// Akademik dönemler — GET/POST/PATCH/DELETE /api/universities/:universityId/academic-terms
// (docs/architecture/FRONTEND_UNIVERSITY.md §8.4)
import { apiClient } from "@/shared/api/client";
import type {
  AcademicTerm,
  ApiEnvelope,
  CreateAcademicTermDto,
  UpdateAcademicTermDto,
} from "@/shared/types";

export const listAcademicTerms = async (universityId: string): Promise<AcademicTerm[]> => {
  const response = await apiClient.get<ApiEnvelope<AcademicTerm[]>>(
    `/universities/${universityId}/academic-terms`
  );
  return response.data.data;
};

export const createAcademicTerm = async (
  universityId: string,
  body: CreateAcademicTermDto
): Promise<AcademicTerm> => {
  const response = await apiClient.post<ApiEnvelope<AcademicTerm>>(
    `/universities/${universityId}/academic-terms`,
    body
  );
  return response.data.data;
};

export const updateAcademicTerm = async (
  universityId: string,
  termId: string,
  body: UpdateAcademicTermDto
): Promise<AcademicTerm> => {
  const response = await apiClient.patch<ApiEnvelope<AcademicTerm>>(
    `/universities/${universityId}/academic-terms/${termId}`,
    body
  );
  return response.data.data;
};

export const deleteAcademicTerm = async (universityId: string, termId: string): Promise<void> => {
  await apiClient.delete(`/universities/${universityId}/academic-terms/${termId}`);
};
