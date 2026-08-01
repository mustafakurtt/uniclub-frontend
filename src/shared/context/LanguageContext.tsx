import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getStoredLanguage, setStoredLanguage, type SupportedLanguage } from "@/shared/i18n/language";

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

/**
 * Kaynak-of-truth localStorage'dır (bkz. shared/i18n/language.ts) — apiClient
 * React ağacı dışında olduğu için isteklerde aynı anahtarı doğrudan okur.
 * Bu context yalnızca UI'ın (dil butonları, olası gelecekteki metinler)
 * seçimi reaktif okuyabilmesi için var.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => getStoredLanguage());

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: SupportedLanguage) => {
    setStoredLanguage(next);
    setLanguageState(next);
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage, LanguageProvider içinde kullanılmalı.");
  return ctx;
}
