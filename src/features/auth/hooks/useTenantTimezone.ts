import { useAuth } from "@/features/auth/hooks/useAuth";

/** Oturumdaki kurum IANA saat dilimi; platform hesabında null. */
export function useTenantTimezone(): string | null {
  const { user } = useAuth();
  return user?.university?.timezone ?? null;
}
