// API zarfı (doküman §1) — tek istisna POST /auth/login (bkz. features/auth/api/auth.ts)

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Hata zarfı (docs/DENETIM_VE_HATA.md §2). `code`/`details`/`requestId` opsiyoneldir
 * — yalnızca ilgili hata türünde gelir. `client.ts`'teki getErrorCode/getErrorDetails/
 * getRequestId bu şekle göre okur; UI hiçbir zaman ham hata gövdesine dokunmamalı.
 */
export interface ApiErrorDetail {
  path: string;
  code: string;
  message: string;
}

export interface ApiErrorEnvelope {
  success: false;
  message: string;
  code?: string;
  details?: ApiErrorDetail[];
  requestId?: string;
}
