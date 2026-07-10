import { useAuth } from "@/features/auth/hooks/useAuth";
import type { ClubRole } from "@/shared/types";

// Katman B guard'ları — yalnızca `approved` üyelikler yetki sayılır
// (docs/FRONTEND_AUTH_RBAC.md §5.4, docs/FRONTEND_CLUBS.md §7). Login-time
// snapshot'a dayanır; kulüp yönetim paneli gibi kritik ekranlarda kulüp
// detayından çapraz kontrol edilmesi önerilir.

/** Kulüp-içi rolüm (member/officer/president) — danışmanlık BURADA görünmez. */
export function useClubRole(clubId: string): ClubRole | null {
  const { clubRoleOf } = useAuth();
  return clubRoleOf(clubId);
}

/**
 * "Staff" mıyım? (danışman VEYA officer/başkan — FRONTEND_CLUBS.md §1)
 * İçerik girme (duyuru/galeri) ve istek/üye görüntüleme yetkisinin UI karşılığı.
 * Karar mercii işleri (onay/çıkarma/rol/devir/profil) için useClubRole'a bakın.
 */
export function useIsClubStaff(clubId: string): boolean {
  const { isClubStaff } = useAuth();
  return isClubStaff(clubId);
}
