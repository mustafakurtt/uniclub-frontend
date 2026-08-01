// Üniversite / domain / fakülte / bölüm (doküman §6)
// Tenant hiyerarşisi: Üniversite → (Domain | Fakülte) → Bölüm.

export type DomainType = "student" | "staff";

export interface University {
  id: string;
  name: string;
  slug: string;
  /** IANA saat dilimi — tenant duvar saati (C2). */
  timezone?: string;
  defaultLocale?: string;
  // Liste/detay uçları döner; oturum içindeki University alt kümesinde bulunmaz (opsiyonel).
  createdAt?: string;
  updatedAt?: string;
}

export interface UniversityDomain {
  id: string;
  universityId: string;
  domain: string;
  domainType: DomainType;
}

export interface Faculty {
  id: string;
  universityId: string;
  name: string;
}

export interface Department {
  id: string;
  facultyId: string;
  name: string;
}
