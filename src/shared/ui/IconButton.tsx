import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "@/shared/ui/Icon";

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  icon: IconName;
  /** Erişilebilirlik etiketi + tooltip (zorunlu — ikon-only buton). */
  label: string;
  tone?: "default" | "danger";
  size?: number;
}

/**
 * İkon-only aksiyon butonu (core). Listelerde tekrar eden düzenle/sil/kapat
 * gibi eylemler için tek nokta — `btn-ghost` tabanı, tehlike tonu ve zorunlu
 * `aria-label` bir arada. Emoji butonlarının yerini alır.
 */
export default function IconButton({
  icon,
  label,
  tone = "default",
  size = 16,
  className = "",
  type = "button",
  ...rest
}: IconButtonProps) {
  const toneClass =
    tone === "danger" ? "text-slate-400 hover:text-red-600" : "text-slate-500 hover:text-brand-700";
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`btn-ghost px-2.5 py-1.5 ${toneClass} ${className}`}
      {...rest}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}
