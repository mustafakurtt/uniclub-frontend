import type { ReactNode } from "react";
import { Icon, type IconName } from "@/shared/ui/Icon";

interface EmptyStateProps {
  /** Merkezi ikon kaydından bir ad (bkz. Icon.tsx). */
  icon?: IconName;
  title: ReactNode;
  description?: ReactNode;
  /** İsteğe bağlı aksiyon (ör. "İlk kaydı oluştur" butonu). */
  action?: ReactNode;
}

// Proje bağımsız "boş liste" durumu (core). Liste/tablo boşken tutarlı görünüm.
export default function EmptyState({ icon = "inbox", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
        <Icon name={icon} size={26} />
      </div>
      <p className="font-display text-lg font-bold text-slate-800">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
