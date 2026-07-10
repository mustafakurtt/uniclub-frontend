import type { ReactNode } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface RequireManagementProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// Yönetim paneli kabuğunu koruyan guard (docs/FRONTEND_YONETIM.md §4/§7):
// erişim rol adına değil, kullanıcının HERHANGİ bir yönetim yetkisine sahip
// olmasına bağlıdır (`isAdmin` = effective permissions boş değil). Böylece 9
// rolün her biri (auditor, content_moderator, … dahil) uygun bölümleri görür;
// student/advisor gibi yetkisiz roller Forbidden alır. Yalnızca UX içindir.
export default function RequireManagement({ children, fallback = null }: RequireManagementProps) {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
