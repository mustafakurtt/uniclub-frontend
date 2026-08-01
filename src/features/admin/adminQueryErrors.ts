import axios from "axios";

/** Yönetim paneli — 403 "bu işin değil", sistem hatası değil. */
export function isForbiddenAdminError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403;
}
