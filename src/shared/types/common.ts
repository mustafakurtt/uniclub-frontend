// API zarfı (doküman §1) — tek istisna POST /auth/login (bkz. features/auth/api/auth.ts)

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}
