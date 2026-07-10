// University feature'ı — /api/universities (docs/FRONTEND_UNIVERSITY.md).
//
// İki tür tüketici vardır:
//  • Public okuma (GET) — kayıt/onboarding ağacı; auth gerektirmez.
//  • Sistem yönetim paneli (POST/PATCH/DELETE) — granüler `university.*` yetkisi
//    ister ve tenantScoped'tır (super_admin bypass eder).
//
// Tenant hiyerarşisi: Üniversite → (Domain | Fakülte) → Bölüm. Bölüm rotaları her
// zaman fakülte zinciriyle çalışır; "üniversitenin tüm bölümleri" ucu YOKTUR (§1).
import { apiClient } from "@/shared/api/client";
import type {
  ApiEnvelope,
  Department,
  DomainType,
  Faculty,
  University,
  UniversityDomain,
} from "@/shared/types";

// ---------------------------------------------------------------------------
// Request DTO'ları (doküman §4–§7) — sayfa şemaları bunları infer etmek yerine
// kendi zod şemasını kurar; bu tipler API imzasını netleştirmek içindir.
// ---------------------------------------------------------------------------

export interface CreateUniversityDto {
  name: string;
  slug: string;
  domains: { domain: string; domainType: DomainType }[]; // en az 1
}
export interface UpdateUniversityDto {
  name?: string;
  slug?: string;
}
export interface CreateDomainDto {
  domain: string;
  domainType: DomainType;
}
export type UpdateDomainDto = Partial<CreateDomainDto>;
export interface FacultyNameDto {
  name: string;
}
export type DepartmentNameDto = FacultyNameDto;

// ---------------------------------------------------------------------------
// Üniversiteler (§4)
// ---------------------------------------------------------------------------

/**
 * ⚠️ PUBLIC ve bilinçli olarak GLOBAL: herkese TÜM üniversiteleri döner.
 * Yalnızca giriş yapmamış kullanıcının kayıt/onboarding akışı içindir.
 *
 * Yönetim panelinde ASLA kullanma — `university_admin` başka okulları da görür.
 * Panelde `getAccessibleUniversities()` (features/admin/api/universities.ts)
 * ya da `useAdminScope()` kullan (FRONTEND_RUTBE_VE_PLATFORM.md §2).
 */
export const getUniversities = async (search?: string): Promise<University[]> => {
  const response = await apiClient.get<ApiEnvelope<University[]>>("/universities", {
    params: search ? { search } : undefined,
  });
  return response.data.data;
};

export const getUniversity = async (
  universityId: string
): Promise<University & { domains: UniversityDomain[] }> => {
  const response = await apiClient.get<ApiEnvelope<University & { domains: UniversityDomain[] }>>(
    `/universities/${universityId}`
  );
  return response.data.data;
};

// POST /universities · `university.create` — tenantScoped DEĞİL (§4.3).
export const createUniversity = async (
  dto: CreateUniversityDto
): Promise<{ university: University; domains: UniversityDomain[] }> => {
  const response = await apiClient.post<
    ApiEnvelope<{ university: University; domains: UniversityDomain[] }>
  >("/universities", dto);
  return response.data.data;
};

// PATCH /universities/:id · `university.update` · tenantScoped (§4.4).
export const updateUniversity = async (
  universityId: string,
  dto: UpdateUniversityDto
): Promise<University> => {
  const response = await apiClient.patch<ApiEnvelope<University>>(
    `/universities/${universityId}`,
    dto
  );
  return response.data.data;
};

// DELETE /universities/:id · `university.delete` · tenantScoped (§4.5).
export const deleteUniversity = async (universityId: string): Promise<void> => {
  await apiClient.delete(`/universities/${universityId}`);
};

// ---------------------------------------------------------------------------
// Domainler (§5)
// ---------------------------------------------------------------------------

export const getDomains = async (universityId: string): Promise<UniversityDomain[]> => {
  const response = await apiClient.get<ApiEnvelope<UniversityDomain[]>>(
    `/universities/${universityId}/domains`
  );
  return response.data.data;
};

export const createDomain = async (
  universityId: string,
  dto: CreateDomainDto
): Promise<UniversityDomain> => {
  const response = await apiClient.post<ApiEnvelope<UniversityDomain>>(
    `/universities/${universityId}/domains`,
    dto
  );
  return response.data.data;
};

export const updateDomain = async (
  universityId: string,
  domainId: string,
  dto: UpdateDomainDto
): Promise<UniversityDomain> => {
  const response = await apiClient.patch<ApiEnvelope<UniversityDomain>>(
    `/universities/${universityId}/domains/${domainId}`,
    dto
  );
  return response.data.data;
};

export const deleteDomain = async (universityId: string, domainId: string): Promise<void> => {
  await apiClient.delete(`/universities/${universityId}/domains/${domainId}`);
};

// ---------------------------------------------------------------------------
// Fakülteler (§6)
// ---------------------------------------------------------------------------

export const getFaculties = async (universityId: string): Promise<Faculty[]> => {
  const response = await apiClient.get<ApiEnvelope<Faculty[]>>(
    `/universities/${universityId}/faculties`
  );
  return response.data.data;
};

export const getFaculty = async (
  universityId: string,
  facultyId: string
): Promise<Faculty> => {
  const response = await apiClient.get<ApiEnvelope<Faculty>>(
    `/universities/${universityId}/faculties/${facultyId}`
  );
  return response.data.data;
};

export const createFaculty = async (
  universityId: string,
  dto: FacultyNameDto
): Promise<Faculty> => {
  const response = await apiClient.post<ApiEnvelope<Faculty>>(
    `/universities/${universityId}/faculties`,
    dto
  );
  return response.data.data;
};

export const updateFaculty = async (
  universityId: string,
  facultyId: string,
  dto: FacultyNameDto
): Promise<Faculty> => {
  const response = await apiClient.patch<ApiEnvelope<Faculty>>(
    `/universities/${universityId}/faculties/${facultyId}`,
    dto
  );
  return response.data.data;
};

export const deleteFaculty = async (universityId: string, facultyId: string): Promise<void> => {
  await apiClient.delete(`/universities/${universityId}/faculties/${facultyId}`);
};

// ---------------------------------------------------------------------------
// Bölümler (§7) — her zaman fakülte üzerinden. Backend, bölüm→fakülte→üniversite
// zincirini doğrular; "üniversitenin tüm bölümleri" endpoint'i bilinçli olarak yok.
// ---------------------------------------------------------------------------

export const getDepartments = async (
  universityId: string,
  facultyId: string
): Promise<Department[]> => {
  const response = await apiClient.get<ApiEnvelope<Department[]>>(
    `/universities/${universityId}/faculties/${facultyId}/departments`
  );
  return response.data.data;
};

export const createDepartment = async (
  universityId: string,
  facultyId: string,
  dto: DepartmentNameDto
): Promise<Department> => {
  const response = await apiClient.post<ApiEnvelope<Department>>(
    `/universities/${universityId}/faculties/${facultyId}/departments`,
    dto
  );
  return response.data.data;
};

export const updateDepartment = async (
  universityId: string,
  facultyId: string,
  departmentId: string,
  dto: DepartmentNameDto
): Promise<Department> => {
  const response = await apiClient.patch<ApiEnvelope<Department>>(
    `/universities/${universityId}/faculties/${facultyId}/departments/${departmentId}`,
    dto
  );
  return response.data.data;
};

export const deleteDepartment = async (
  universityId: string,
  facultyId: string,
  departmentId: string
): Promise<void> => {
  await apiClient.delete(
    `/universities/${universityId}/faculties/${facultyId}/departments/${departmentId}`
  );
};
