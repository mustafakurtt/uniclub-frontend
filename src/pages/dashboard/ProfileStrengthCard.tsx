import { Link } from "react-router-dom";
import type { MeProfile } from "@/shared/types";
import { useCountUp } from "@/shared/hooks/useCountUp";
import { Icon } from "@/shared/ui/Icon";

/**
 * Profil gücü — tamamlanmamış profili bir "seviye çubuğuna" çevirir.
 * Eksik her alan gidilecek küçük bir görev gibi listelenir; %100'e ulaşmak
 * "Tam Profil" rozetini açar (AchievementsCard). Tamamen istemci tarafı,
 * MeProfile'daki alanlardan türetilir.
 */

interface CompletionItem {
  label: string;
  done: boolean;
}

export function profileCompletion(user: MeProfile): { percent: number; missing: string[] } {
  const items: CompletionItem[] = [
    { label: "Profil fotoğrafı ekle", done: !!user.photoUrl },
    { label: "Bölümünü seç", done: !!user.department },
    { label: "Öğrenci numaranı gir", done: !!user.studentNumber },
  ];
  // Hesap açmak zaten %40 — çubuk hiç boş başlamaz, motive eder.
  const percent = 40 + items.filter((i) => i.done).length * 20;
  return { percent, missing: items.filter((i) => !i.done).map((i) => i.label) };
}

const RADIUS = 30;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProfileStrengthCard({ user }: { user: MeProfile }) {
  const { percent, missing } = profileCompletion(user);
  const animated = useCountUp(percent, 1200);
  const complete = percent >= 100;

  return (
    <div className="card p-6">
      <div className="flex items-center gap-5">
        {/* İlerleme halkası */}
        <div className="relative shrink-0 w-[76px] h-[76px]">
          <svg viewBox="0 0 76 76" className="w-full h-full -rotate-90">
            <circle cx="38" cy="38" r={RADIUS} fill="none" strokeWidth="7" className="stroke-brand-100" />
            <circle
              cx="38" cy="38" r={RADIUS} fill="none" strokeWidth="7" strokeLinecap="round"
              stroke="url(#profil-guc-gradyan)"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - animated / 100)}
            />
            <defs>
              <linearGradient id="profil-guc-gradyan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-sm font-extrabold text-brand-800">
            %{animated}
          </span>
        </div>

        <div className="min-w-0">
          <h3 className="font-display font-bold text-slate-900">Profil Gücü</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {complete
              ? "Efsanesin — profilin eksiksiz."
              : "Profilini tamamla, rozetini kap."}
          </p>
        </div>
      </div>

      {complete ? (
        <div className="mt-5 flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-50 to-accent-50 px-4 py-3 text-sm font-bold text-brand-700">
          <Icon name="star" size={16} className="text-amber-500" /> "Tam Profil" rozeti senin!
        </div>
      ) : (
        <ul className="mt-5 space-y-2">
          {missing.map((task) => (
            <li key={task}>
              <Link
                to="/profile"
                className="tap group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-200 hover:text-brand-700"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-300 group-hover:border-brand-400 transition-colors" />
                <span className="flex-1 truncate">{task}</span>
                <span className="sticker bg-brand-600 text-white">+20</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
