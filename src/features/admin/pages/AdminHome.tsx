import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { CLUB_PERMISSIONS, UNIVERSITY_PERMISSIONS } from "@/features/auth/authorization";
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
  if (UNIVERSITY_PERMISSIONS.some((p) => hasPermission(p)))
    return <Navigate to="/admin/universities" replace />;
  if (hasPermission("role.manage")) return <Navigate to="/admin/roles" replace />;
  if (hasPermission("permission.manage")) return <Navigate to="/admin/permissions" replace />;

  // RequireManagement zaten yetkisizi elemişti; buraya düşmek beklenmez.
  return <Forbidden />;
}
