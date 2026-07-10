import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Icon } from "@/shared/ui/Icon";

/**
 * Göster/gizle düğmeli şifre alanı — react-hook-form'un `register(...)`
 * dönüşünü `registration` ile alır, `input-field` görsel dilini korur.
 * Düğme `type="button"` olduğundan formu göndermez; odak halkası alanın
 * kendisinde kalır.
 */
export function PasswordInput({
  registration,
  placeholder,
  autoComplete,
}: {
  registration: UseFormRegisterReturn;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        {...registration}
        className="input-field pr-12"
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
        className="tap absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400
                   hover:text-brand-600 hover:bg-brand-50 transition-colors"
      >
        <Icon name={visible ? "eyeOff" : "eye"} size={18} aria-hidden />
      </button>
    </div>
  );
}
