// Auth feature'ı — /api/auth (docs/FRONTEND_AUTH_RBAC.md §4).
// Yalnızca kimlik işlemleri; profil/üyelik self-service çağrıları api/users.ts'te.
// 4.5–4.7 yönetim rotaları (promote/demote, rol/permission CRUD) sistem
// yönetim paneli yapılana kadar bilinçli olarak bağlanmadı.
import { apiClient } from "@/shared/api/client";
import type { ApiEnvelope, SafeUser } from "@/shared/types";

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  firstName: string;
  lastName: string;
  email: string;
  studentNumber?: string;
  password: string;
}

export interface LoginResult {
  user: SafeUser;
  token: string;
}

/**
 * POST /auth/login — tek istisnai zarf: `data` yok, kökte `user` + `token` (§4.2).
 * Dönen `user` rol içermez; roller login sonrası GET /users/me ile gelir
 * (AuthContext bunu otomatik yapar).
 */
export const login = async (dto: LoginDTO): Promise<LoginResult> => {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    user: SafeUser;
    token: string;
  }>("/auth/login", dto);
  return { user: response.data.user, token: response.data.token };
};

/** POST /auth/register — başarı mesajını döner; kullanıcı `pending` başlar (§4.1). */
export const register = async (dto: RegisterDTO): Promise<string> => {
  const response = await apiClient.post<ApiEnvelope<SafeUser>>("/auth/register", dto);
  return response.data.message;
};

/** GET /auth/verify?token= — e-posta doğrulama; token tek kullanımlık (§4.3). */
export const verifyEmail = async (token: string): Promise<string> => {
  const response = await apiClient.get<{ success: boolean; message: string }>("/auth/verify", {
    params: { token },
  });
  return response.data.message;
};

/**
 * POST /auth/resend-verification — doğrulama mailini yeniden gönderir
 * (docs/MAIL_DOGRULAMA.md). Hesap yoksa ya da zaten `active`/`suspended` ise de
 * 200 + aynı mesaj döner: yanıt bilinçli olarak sabittir, aksi halde endpoint
 * "bu e-posta kayıtlı mı?" sorgusuna (user enumeration) dönüşür. Bu yüzden UI
 * de "gönderildi" demek yerine backend mesajını olduğu gibi göstermeli.
 * Yeni link üretilirken kullanıcının eski token'ları geçersizleşir.
 */
export const resendVerification = async (email: string): Promise<string> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    "/auth/resend-verification",
    { email }
  );
  return response.data.message;
};

/**
 * GET /auth/me — minimal kimlik kontrolü (§4.4): { userId, universityId }.
 * `universityId` platform hesaplarında null'dır (FRONTEND_RUTBE_VE_PLATFORM.md §1).
 * Tam profil için users.getMyProfile kullanın.
 */
export const getAuthCheck = async (): Promise<{ userId: string; universityId: string | null }> => {
  const response = await apiClient.get<ApiEnvelope<{ userId: string; universityId: string | null }>>(
    "/auth/me"
  );
  return response.data.data;
};
