// SaaS platform operatör paneli — GET/POST/PATCH /api/platform/* (platform-panel.md).
import type { DomainType } from "./university";

export type UniversityLifecycleStatus = "trial" | "active" | "past_due" | "suspended";

export type TenantAdminInvitationStatus = "pending" | "accepted" | "cancelled" | "expired";

export type PlatformAccountRoleName = "super_admin" | "platform_support";

export interface TenantListItem {
  id: string;
  name: string;
  slug: string;
  status: UniversityLifecycleStatus;
  statusReason: string | null;
  statusChangedAt: string | null;
  statusChangedBy: string | null;
  createdAt: string;
  updatedAt: string;
  domainCount: number;
  userCount: number;
  clubCount: number;
  pendingApplications: number;
}

export interface TenantListPage {
  items: TenantListItem[];
  nextCursor: string | null;
}

export interface TenantAdminInvitation {
  id: string;
  universityId: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
  status: TenantAdminInvitationStatus;
  expiresAt: string;
  invitedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardTenantDomain {
  domain: string;
  domainType: DomainType;
}

export interface OnboardTenantFaculty {
  name: string;
  departments?: string[];
}

export interface OnboardTenantInitialAdmin {
  firstName: string;
  lastName: string;
  email: string;
}

export interface OnboardTenantDto {
  name: string;
  slug: string;
  status?: UniversityLifecycleStatus;
  domains: OnboardTenantDomain[];
  faculties?: OnboardTenantFaculty[];
  initialAdmin?: OnboardTenantInitialAdmin;
}

export interface OnboardTenantResult {
  university: {
    id: string;
    name: string;
    slug: string;
    status: UniversityLifecycleStatus;
    createdAt: string;
    updatedAt: string;
  };
  domains: Array<{
    id: string;
    universityId: string;
    domain: string;
    domainType: string;
    createdAt: string;
    updatedAt: string;
  }>;
  faculties: Array<{
    id: string;
    name: string;
    universityId: string;
    createdAt: string;
    updatedAt: string;
    departments: Array<{
      id: string;
      facultyId: string;
      name: string;
      createdAt: string;
      updatedAt: string;
    }>;
  }>;
  initialAdminInvitation: TenantAdminInvitation | null;
}

export interface UpdateTenantStatusDto {
  status: UniversityLifecycleStatus;
  reason: string;
}

export interface InviteTenantAdminDto {
  firstName: string;
  lastName: string;
  email: string;
}

export interface PlatformUserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
  roles: string[];
}

export interface CreatePlatformUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: PlatformAccountRoleName;
}
