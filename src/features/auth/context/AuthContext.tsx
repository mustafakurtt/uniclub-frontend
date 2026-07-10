import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, getMyClubMemberships, getMyAdvisedClubs, getMyPermissions } from "@/features/auth/api/users";
import { isPlatformRole, isSuperAdminRole } from "@/features/auth/authorization";
import type {
  AdvisedClub,
  ClubMembership,
  ClubRole,
  GlobalPermission,
  MeProfile,
  RoleName,
  UserStatus,
} from "@/shared/types";

/**
 * Oturum state'inin tek kaynağı (docs/FRONTEND_AUTH_RBAC.md §7.1):
 *
 *   login → token'ı sakla → GET /users/me (profil + roller)
 *                         → GET /users/me/permissions (etkin yetki + durum)
 *                         → GET /users/me/clubs (üyelikler)
 *                         → GET /users/me/advised-clubs (yalnızca advisor rolünde)
 *
 * Sayfa yenilenince token localStorage'dan okunur ve aynı istekler atılır.
 * Herhangi bir istek 401 (ya da askı 403'ü) dönerse apiClient interceptor'ı
 * "auth:unauthorized" event'i fırlatır; burada dinlenip oturum temizlenir
 * (altın kural: bu guard'lar yalnızca UX içindir, gerçek yetki backend'dedir).
 */
interface AuthContextValue {
  token: string | null;
  /** GET /users/me — tam profil (üniversite, bölüm ve roller dahil) */
  user: MeProfile | null;
  /** Global rol adları — Katman A (ör. ["student"], ["university_admin"]) */
  roleNames: RoleName[];
  /** Etkin (effective) yetki seti — /users/me/permissions'tan (override'lar uygulanmış) */
  permissions: GlobalPermission[];
  /** Hesap durumu — /users/me/permissions'tan (pending/active/suspended) */
  status: UserStatus | null;
  /** TÜM üyelik satırları (pending dahil) — yetki için clubRoleOf kullanın */
  clubMemberships: ClubMembership[];
  /** Danışmanı olduğum kulüpler (yalnızca advisor rolünde dolu — FRONTEND_CLUBS.md §10) */
  advisedClubs: AdvisedClub[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  // Katman A guard'ları — kararlar permission'a göre (FRONTEND_YONETIM.md §4)
  hasRole: (role: RoleName) => boolean;
  hasPermission: (permission: GlobalPermission) => boolean;
  /** hasPermission alias — okunabilir çağrı için: can("club.approve") */
  can: (permission: GlobalPermission) => boolean;
  /** Yönetim paneline erişebilir mi (herhangi bir yönetim yetkisi var mı) */
  isAdmin: boolean;
  isSuperAdmin: boolean;
  /** Çapraz-tenant rolleri (super_admin/platform_support) → tüm tenant'ları görür */
  isPlatform: boolean;
  /**
   * Tenant'sız platform çalışanı (universityId === null).
   * Öğrenci self-service akışları (kulüpler, katılma, başvuru) bu hesaba
   * kapalıdır — backend 400 döner (FRONTEND_RUTBE_VE_PLATFORM.md §1).
   */
  isPlatformAccount: boolean;
  /** Rollerimdeki en yüksek rütbe — aksiyon disable mantığı için (§4) */
  maxRank: number;
  // Katman B guard'ları (§7.2) — yalnızca approved üyelikler sayılır
  clubRoleOf: (clubId: string) => ClubRole | null;
  /** Danışmanlık kulüp-içi rol DEĞİLDİR (ayrı tablo) — clubRoleOf null döner */
  isAdvisorOf: (clubId: string) => boolean;
  /** "Staff" = danışman VEYA officer/başkan: duyuru/galeri girme + istek/üye görüntüleme */
  isClubStaff: (clubId: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMyProfile,
    enabled: !!token,
    retry: false,
  });

  const permissionsQuery = useQuery({
    queryKey: ["auth", "permissions"],
    queryFn: getMyPermissions,
    enabled: !!token,
    retry: false,
  });

  const clubsQuery = useQuery({
    queryKey: ["auth", "clubMemberships"],
    queryFn: getMyClubMemberships,
    enabled: !!token,
    retry: false,
  });

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    queryClient.removeQueries({ queryKey: ["auth"] });
  }, [queryClient]);

  const login = useCallback((newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }, []);

  // apiClient'tan gelen herhangi bir 401 (client.ts interceptor'ı fırlatır)
  useEffect(() => {
    window.addEventListener("auth:unauthorized", logout);
    return () => window.removeEventListener("auth:unauthorized", logout);
  }, [logout]);

  const user = meQuery.data ?? null;
  const clubMemberships = useMemo(() => clubsQuery.data ?? [], [clubsQuery.data]);

  const roleNames = useMemo<RoleName[]>(
    () => user?.roles.map((r) => r.name) ?? [],
    [user]
  );

  // Danışmanlık ancak advisor rolünde anlamlıdır (başkası için boş dizi döner);
  // gereksiz isteği önlemek için rol yüklendikten sonra ve yalnızca advisor'da atılır.
  const advisedQuery = useQuery({
    queryKey: ["auth", "advisedClubs"],
    queryFn: getMyAdvisedClubs,
    enabled: !!token && roleNames.includes("advisor"),
    retry: false,
  });
  const advisedClubs = useMemo(() => advisedQuery.data ?? [], [advisedQuery.data]);

  // Etkin yetki seti + hesap durumu backend'ten (FRONTEND_YONETIM.md §4):
  // rollerden gelen + kişisel override uygulanmış nihai liste.
  const permissions = useMemo<GlobalPermission[]>(
    () => permissionsQuery.data?.permissions ?? [],
    [permissionsQuery.data]
  );
  const status = permissionsQuery.data?.status ?? user?.status ?? null;
  // Rütbe backend'ten gelir; yoksa 0 (hiçbir şeyi yönetemez) — güvenli varsayılan.
  const maxRank = permissionsQuery.data?.maxRank ?? 0;

  const clubRoleOf = useCallback(
    (clubId: string): ClubRole | null =>
      clubMemberships.find((m) => m.clubId === clubId && m.status === "approved")?.role ?? null,
    [clubMemberships]
  );

  const isAdvisorOf = useCallback(
    (clubId: string): boolean => advisedClubs.some((a) => a.clubId === clubId),
    [advisedClubs]
  );

  // Backend'in requireClubStaff'ının UI karşılığı (FRONTEND_CLUBS.md §1, §9-10):
  // içerik girme + istek/üye görüntüleme. Karar mercii işleri (onay/çıkarma/rol/
  // devir/profil) için clubRoleOf'tan officer/president kontrolü gerekir.
  const isClubStaff = useCallback(
    (clubId: string): boolean => {
      const role = clubRoleOf(clubId);
      return role === "officer" || role === "president" || isAdvisorOf(clubId);
    },
    [clubRoleOf, isAdvisorOf]
  );

  const hasPermission = useCallback(
    (permission: GlobalPermission) => permissions.includes(permission),
    [permissions]
  );

  const value: AuthContextValue = {
    token,
    user,
    roleNames,
    permissions,
    status,
    clubMemberships,
    advisedClubs,
    isAuthenticated: !!token,
    // Yetki gerektiren rotalarda erken "Forbidden" flaş'ını önlemek için
    // profil VE yetki sorgusu tamamlanana kadar yükleniyor say.
    isLoading: !!token && (meQuery.isLoading || permissionsQuery.isLoading),
    login,
    logout,
    hasRole: (role) => roleNames.includes(role),
    hasPermission,
    can: hasPermission,
    // Yönetim paneli: herhangi bir yönetim yetkisi (student/advisor → boş → gizli)
    isAdmin: permissions.length > 0,
    isSuperAdmin: isSuperAdminRole(roleNames),
    isPlatform: isPlatformRole(roleNames),
    isPlatformAccount: !!user && user.universityId === null,
    maxRank,
    clubRoleOf,
    isAdvisorOf,
    isClubStaff,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth, AuthProvider içinde kullanılmalıdır.");
  }
  return ctx;
}
