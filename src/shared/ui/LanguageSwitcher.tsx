import { useLanguage } from "@/shared/context/LanguageContext";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/shared/i18n/language";

const LABELS: Record<SupportedLanguage, string> = { tr: "TR", en: "EN" };

interface LanguageSwitcherProps {
  className?: string;
}

/** Global dil değiştirici — apiClient'ın gönderdiği `Accept-Language` başlığını belirler. */
export default function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Dil seçimi"
      className={`inline-flex items-center rounded-full border border-slate-200 bg-white/70 p-0.5 backdrop-blur ${className}`}
    >
      {SUPPORTED_LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={language === code}
          onClick={() => setLanguage(code)}
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-all duration-200 ${
            language === code
              ? "bg-brand-600 text-white shadow-glow"
              : "text-slate-500 hover:text-brand-700"
          }`}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  );
}
