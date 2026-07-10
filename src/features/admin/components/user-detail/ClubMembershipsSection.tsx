// Kulüp üyelikleri — salt bilgi. Kulüp-içi rol (Katman B) buradan yönetilmez.
import { CLUB_ROLE_LABELS, CLUB_STATUS_LABELS } from "@/features/clubs/labels";
import { Icon } from "@/shared/ui/Icon";
import type { ClubMembership } from "@/shared/types";

export default function ClubMembershipsSection({
  memberships,
}: {
  memberships: ClubMembership[];
}) {
  if (memberships.length === 0) return null;

  return (
    <section>
      <h3 className="input-label">Kulüp Üyelikleri</h3>
      <ul className="space-y-1">
        {memberships.map((m) => (
          <li key={m.clubId} className="flex items-center gap-2 text-xs text-slate-600">
            <Icon name="club" size={13} className="text-brand-500" />
            <span className="font-semibold">{m.club.name}</span>
            <span className="chip">{CLUB_ROLE_LABELS[m.role]}</span>
            <span className="text-slate-400">{CLUB_STATUS_LABELS[m.club.status]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
