import type { ReactNode } from "react";
import type { RoleName } from "@/shared/types";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface RequireRoleProps {
  role: RoleName | RoleName[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RequireRole({ role, children, fallback = null }: RequireRoleProps) {
  const { hasRole } = useAuth();
  const roles = Array.isArray(role) ? role : [role];
  const allowed = roles.some((r) => hasRole(r));
  if (!allowed) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
