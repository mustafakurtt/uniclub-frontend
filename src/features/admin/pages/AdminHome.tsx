import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { CLUB_PERMISSIONS, MODERATION_PERMISSIONS, UNIVERSITY_PERMISSIONS } from "@/features/auth/authorization";
import Forbidden from "@/features/auth/pages/Forbidden";

// /admin girişi — kullanıcının GÖREBİLDİĞİ ilk yönetim bölümüne yönlendirir
// (docs/FRONTEND_YONETIM.md §7). Sabit bir hedefe yönlendirmek, o bölümün
// yetkisi olmayan rolleri (ör. content_moderator'da user.view yok) boş ekrana
// düşürürdü. Öncelik = sidebar sırası.
export default function AdminHome() {
  const { hasPermission } = useAuth();

  if (hasPermission("user.view")) return <Navigate to="/admin/users" replace />;
  if (CLUB_PERMISSIONS.some((p) => hasPermission(p)))
    return <Navigate to="/admin/clubs" replace />;
  if (hasPermission("club.view") && MODERATION_PERMISSIONS.some((p) => hasPermission(p)))
    return <Navigate to="/admin/moderation" replace />;
  if (UNIVERSITY_PERMISSIONS.some((p) => hasPermission(p)))
    return <Navigate to="/admin/universities" replace />;
  if (hasPermission("university.settings.manage"))
    return <Navigate to="/admin/settings" replace />;
  if (hasPermission("role.manage")) return <Navigate to="/admin/roles" replace />;
  if (hasPermission("permission.manage")) return <Navigate to="/admin/permissions" replace />;
  if (hasPermission("audit.view")) return <Navigate to="/admin/audit" replace />;
  if (hasPermission("university.export.generate"))
    return <Navigate to="/admin/exports" replace />;

  // RequireManagement zaten yetkisizi elemişti; buraya düşmek beklenmez.
  return <Forbidden />;
}
