// Akademik dönemler — docs/architecture/FRONTEND_UNIVERSITY.md §8.4

export type AcademicTermStatus = "open" | "closed";

export interface AcademicTerm {
  id: string;
  universityId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  status: AcademicTermStatus;
  createdAt: string;
  updatedAt: string;
  /** Sunucu türetimi: status=open ve bugün [startsAt, endsAt] aralığında. */
  isActive: boolean;
}

export interface CreateAcademicTermDto {
  name: string;
  startsAt: string;
  endsAt: string;
  status?: AcademicTermStatus;
}

export interface UpdateAcademicTermDto {
  name?: string;
  startsAt?: string;
  endsAt?: string;
  status?: AcademicTermStatus;
}
