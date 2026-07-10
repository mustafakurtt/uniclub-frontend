import axios from "axios";

/** Tek kaynak: hem REST hem de WebSocket adresi buradan türetilir.
 *  Adres `VITE_API_BASE_URL` env değişkeninden okunur; tanımsızsa yerel geliştirme
 *  varsayılanına düşer (bkz. `.env.example`). */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Backend'in makine-okunur hata kodları (docs/FRONTEND_BILDIRIM_VE_LIMITLER.md §2/§3).
 * Bu kodlara bakılır, `message` string'ine ASLA match edilmez — mesajlar Türkçe
 * kullanıcı metnidir ve değişebilir.
 */
export const ERROR_CODES = {
  /** 403 — hesap `pending`; yazma işlemleri kilitli, okuma serbest. */
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  /** 429 — hız sınırı; `Retry-After` başlığı saniye cinsinden bekleme süresi. */
  RATE_LIMITED: "RATE_LIMITED",
} as const;

/** Hata gövdesindeki `code` alanı (yoksa null). Genel yetki 403'ü kod taşımaz. */
export const getErrorCode = (error: unknown): string | null => {
  if (!axios.isAxiosError(error)) return null;
  const code = (error.response?.data as { code?: unknown } | undefined)?.code;
  return typeof code === "string" ? code : null;
};

/**
 * 429'daki `Retry-After` (saniye). Butonu geri sayımla kilitlemek için.
 * Başlık yoksa/bozuksa null döner — çağıran makul bir varsayılan seçer.
 */
export const getRetryAfterSeconds = (error: unknown): number | null => {
  if (!axios.isAxiosError(error) || error.response?.status !== 429) return null;
  const raw = error.response.headers?.["retry-after"];
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null;
};

// Oturumu merkezi olarak kapatan iki durum (docs/FRONTEND_YONETIM.md §1/§8.3):
//   • 401 = token yok/geçersiz/süresi dolmuş.
//   • 403 + "Hesabınız askıya alınmıştır…" = anlık askı (v2): kullanıcı suspend
//     edildiğinde mevcut token RBAC cache invalidation ile anında geçersizleşir.
// Her iki durumda token silinir ve "auth:unauthorized" fırlatılır; AuthContext
// state'i temizler, ProtectedRoute /login'e yönlendirir.
// Yalnızca Authorization header'ı taşıyan istekler tetikler; login'in kendi
// 401'i (yanlış şifre) ya da normal yetki 403'leri oturum kapatma değildir.
//
// ÜÇÜNCÜ durum oturumu KAPATMAZ: 403 + code EMAIL_NOT_VERIFIED. Doğrulanmamış
// kullanıcı gezinmeye devam etmeli (banner + "maili yeniden gönder" akışı bunun
// için var); sadece yazma isteği reddedilir. "auth:email-not-verified" event'i
// global bir modal açar (features/auth/components/EmailNotVerifiedModal.tsx).
// Bu yüzden askı kontrolü mesaja değil, ÖNCE koda bakmak zorunda: ikisi de 403.
const SUSPENDED_MESSAGE_PREFIX = "Hesabınız askıya alınmıştır";

export const EMAIL_NOT_VERIFIED_EVENT = "auth:email-not-verified";

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.config?.headers?.Authorization) {
      const status = error.response?.status;
      const code = getErrorCode(error);
      const message = (error.response?.data as { message?: string } | undefined)?.message;

      if (status === 403 && code === ERROR_CODES.EMAIL_NOT_VERIFIED) {
        window.dispatchEvent(new Event(EMAIL_NOT_VERIFIED_EVENT));
        return Promise.reject(error);
      }

      const isSuspended =
        status === 403 && typeof message === "string" && message.startsWith(SUSPENDED_MESSAGE_PREFIX);
      if (status === 401 || isSuspended) {
        localStorage.removeItem("token");
        window.dispatchEvent(new Event("auth:unauthorized"));
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Backend her hatada { success: false, message: "Türkçe mesaj" } zarfı döner;
 * message doğrudan UI'da gösterilebilir (docs/FRONTEND_AUTH_RBAC.md §7.4).
 * Tek istisna zod validasyon hataları (400): zarf yerine zod issue formatı
 * gelir — o durumda ilk issue mesajını, o da yoksa fallback'i döneriz.
 */
export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data;
    if (typeof body?.message === "string") {
      return body.message;
    }
    const zodIssueMessage = body?.error?.issues?.[0]?.message;
    if (typeof zodIssueMessage === "string") {
      return zodIssueMessage;
    }
    return fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};
