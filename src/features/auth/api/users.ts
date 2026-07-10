// Users feature'ı — /api/users (docs/FRONTEND_AUTH_RBAC.md §5).
// Tamamen self-service: her çağrı giriş yapmış kullanıcının kendi verisi.
import { apiClient } from "@/shared/api/client";
import type {
  AdvisedClub,
  ApiEnvelope,
  ClubApplication,
  ClubMembership,
  EffectivePermissions,
  MeProfile,
  SafeUser,
} from "@/shared/types";

export interface UpdateProfileDTO {
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  preferredLanguage?: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

/**
 * GET /users/me — oturum açılışında çağrılması gereken ana endpoint (§5.1):
 * tam profil + üniversite + bölüm + global roller. Etkin YETKİ listesi ayrı
 * endpoint'ten gelir (getMyPermissions).
 */
export const getMyProfile = async (): Promise<MeProfile> => {
  const response = await apiClient.get<ApiEnvelope<MeProfile>>("/users/me");
  return response.data.data;
};

/**
 * GET /users/me/permissions — etkin (effective) yetki seti + roller + hesap
 * durumu (FRONTEND_YONETIM.md §4). UI göster/gizle kararlarının ANA kaynağı:
 * rollerden gelen + kişisel override uygulanmış nihai `permissions` listesi.
 */
export const getMyPermissions = async (): Promise<EffectivePermissions> => {
  const response = await apiClient.get<ApiEnvelope<EffectivePermissions>>("/users/me/permissions");
  return response.data.data;
};

/** PATCH /users/me — e-posta/öğrenci no/bölüm buradan değiştirilemez (§5.2). */
export const updateMyProfile = async (dto: UpdateProfileDTO): Promise<SafeUser> => {
  const response = await apiClient.patch<ApiEnvelope<SafeUser>>("/users/me", dto);
  return response.data.data;
};

/** PATCH /users/me/password — başarı mesajını döner; token geçersiz kılınmaz (§5.3). */
export const changeMyPassword = async (dto: ChangePasswordDTO): Promise<string> => {
  const response = await apiClient.patch<{ success: boolean; message: string }>(
    "/users/me/password",
    dto
  );
  return response.data.message;
};

/**
 * GET /users/me/clubs — üyelik satırları, `club` objesi gömülü (§5.4).
 * DİKKAT: pending satırlar da gelir; yetki kararında status === "approved" şart.
 */
export const getMyClubMemberships = async (): Promise<ClubMembership[]> => {
  const response = await apiClient.get<ApiEnvelope<ClubMembership[]>>("/users/me/clubs");
  return response.data.data;
};

/** GET /users/me/applications — kulüp KURMA başvuruları, createdAt azalan (üyelik istekleri değil, §5.5). */
export const getMyApplications = async (): Promise<ClubApplication[]> => {
  const response = await apiClient.get<ApiEnvelope<ClubApplication[]>>("/users/me/applications");
  return response.data.data;
};

/**
 * GET /users/me/advised-clubs — danışmanı olduğum kulüpler (FRONTEND_CLUBS.md §10).
 * Yalnızca `advisor` rolü için anlamlıdır; başkası için boş dizi döner.
 * Danışmanlık `clubMembers`'tan bağımsızdır — bu kulüpler /users/me/clubs'ta görünmez.
 */
export const getMyAdvisedClubs = async (): Promise<AdvisedClub[]> => {
  const response = await apiClient.get<ApiEnvelope<AdvisedClub[]>>("/users/me/advised-clubs");
  return response.data.data;
};
