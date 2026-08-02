export const platformTenantsQueryKey = ["platform", "tenants"] as const;

export const platformTenantQueryKey = (universityId: string) =>
  ["platform", "tenants", universityId] as const;

export const platformTenantInvitationsQueryKey = (universityId: string) =>
  ["platform", "tenants", universityId, "invitations"] as const;

export const platformUsersQueryKey = ["platform", "users"] as const;
