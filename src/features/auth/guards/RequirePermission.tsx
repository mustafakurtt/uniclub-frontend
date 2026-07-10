import type { ReactNode } from "react";
import type { GlobalPermission } from "@/shared/types";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface RequirePermissionProps {
  permission: GlobalPermission;
  children: ReactNode;
  fallback?: ReactNode;
}

// Route seviyesi: <RequirePermission permission="club.approve" fallback={<Forbidden />}>
// Buton/menü seviyesi: fallback'siz kullanılırsa yetkisiz kullanıcıya hiçbir şey render edilmez.
export default function RequirePermission({
  permission,
  children,
  fallback = null,
}: RequirePermissionProps) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
