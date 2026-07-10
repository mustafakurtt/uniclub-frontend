import type { ClubMembership, UserStatus } from "@/shared/types";
import { Icon, type IconName } from "@/shared/ui/Icon";

/**
 * Rozetler — mevcut verilerden (üyelikler, hesap durumu, profil doluluk
 * yüzdesi) türetilen istemci tarafı başarımlar. Kilitli rozetler gri ve
 * kesikli çerçeveli görünür; nasıl açılacağı altında yazar. Amaç,
 * "sıradaki küçük hedef"i her zaman görünür kılmak.
 */

interface AchievementBadge {
  icon: IconName;
  label: string;
  hint: string;
  unlocked: boolean;
}

export function AchievementsCard({
  memberships,
  status,
  profilePercent,
}: {
  memberships: ClubMembership[];
  status: UserStatus | null;
  profilePercent: number;
}) {
  // Yalnızca onaylı üyelikler sayılır (§5.4)
  const approved = memberships.filter((m) => m.status === "approved");
  const roles = new Set(approved.map((m) => m.role));

  const badges: AchievementBadge[] = [
    { icon: "check", label: "Kampüslü", hint: "E-postanı doğrula", unlocked: status === "active" },
    { icon: "seedling", label: "İlk Adım", hint: "Bir kulübe katıl", unlocked: approved.length >= 1 },
    { icon: "members", label: "Sosyal Kelebek", hint: "3 kulüpte üye ol", unlocked: approved.length >= 3 },
    { icon: "officer", label: "Yönetimde", hint: "Bir kulüpte yönetici ol", unlocked: roles.has("officer") || roles.has("president") },
    { icon: "president", label: "Başkan", hint: "Bir kulübe başkan ol", unlocked: roles.has("president") },
    { icon: "star", label: "Tam Profil", hint: "Profilini %100 doldur", unlocked: profilePercent >= 100 },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-bold text-slate-900 inline-flex items-center gap-2">
          <Icon name="trophy" size={18} className="text-amber-500" /> Rozetlerin
        </h3>
        <span className="badge">{unlockedCount}/{badges.length}</span>
      </div>

      <ul className="grid grid-cols-3 gap-x-2 gap-y-5">
        {badges.map((badge) => (
          <li key={badge.label} className="flex flex-col items-center text-center gap-1.5" title={badge.hint}>
            {badge.unlocked ? (
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-400 text-white shadow-glow">
                <Icon name={badge.icon} size={20} />
              </span>
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-300">
                <Icon name={badge.icon} size={20} />
              </span>
            )}
            <span className={`text-[11px] font-bold leading-tight ${badge.unlocked ? "text-slate-700" : "text-slate-400"}`}>
              {badge.label}
            </span>
            {!badge.unlocked && (
              <span className="text-[10px] text-slate-400 leading-tight">{badge.hint}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
