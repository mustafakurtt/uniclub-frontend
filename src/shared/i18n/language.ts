// Global dil seçimi — apiClient her istekte bunu `Accept-Language` başlığı
// olarak backend'e gönderir. Şu an backend yalnızca üniversite yönetimi
// uçlarını çeviriyor (pilot); seçim baştan globaldir, backend genişledikçe
// ek iş gerekmez.
export type SupportedLanguage = "tr" | "en";

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["tr", "en"];

export const LANGUAGE_STORAGE_KEY = "uniclub_language";

const isSupportedLanguage = (value: string | null): value is SupportedLanguage =>
  value === "tr" || value === "en";

/** Bölgeli kodlarda da (`en-US`, `en-GB`) eşleşsin diye önek karşılaştırılır. */
const detectBrowserLanguage = (): SupportedLanguage =>
  navigator.language.toLowerCase().startsWith("en") ? "en" : "tr";

/** Sıra: kullanıcının daha önce seçtiği dil → tarayıcı dili → "tr". */
export const getStoredLanguage = (): SupportedLanguage => {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (isSupportedLanguage(stored)) return stored;
  return detectBrowserLanguage();
};

export const setStoredLanguage = (language: SupportedLanguage): void => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
};
