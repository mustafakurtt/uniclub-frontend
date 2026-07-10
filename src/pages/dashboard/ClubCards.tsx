import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { AdvisedClub, Club, ClubMembership } from "@/shared/types";
import TiltCard from "@/shared/ui/TiltCard";
import { Icon } from "@/shared/ui/Icon";
import { CLUB_ROLE_ICONS, CLUB_ROLE_LABELS } from "@/features/clubs/labels";
import { clubIdentity, clubInitial, coverGradient } from "@/features/clubs/clubIdentity";

/**
 * Dashboard'daki kulüp kartları. Üyelik satırı yalnızca ClubSummary taşır
 * (logo/kapak yok); görseller Dashboard'un çektiği kulüp listesinden (`club`
 * prop'u) gelir — bulunamazsa ada dayalı kimlik gradyanına düşülür.
 */

/** Kapak şeridi: görsel varsa görsel + okunurluk tülü, yoksa kimlik gradyanı. */
function CardCover({ name, club, children }: { name: string; club?: Club; children: ReactNode }) {
  return (
    <div className={`h-20 relative overflow-hidden bg-gradient-to-br ${coverGradient(name)}`}>
      {club?.coverUrl ? (
        <>
          <img src={club.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          {/* Açık renkli kapaklarda cam çipler kaybolmasın diye ince karartma */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/45 via-slate-900/10 to-slate-900/30" aria-hidden />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-grid-fine-dark bg-grid-sm opacity-40" aria-hidden />
          <span className="absolute -bottom-3 right-4 text-5xl opacity-25 font-display font-extrabold text-white select-none">
            {clubInitial(name)}
          </span>
        </>
      )}
      {children}
    </div>
  );
}

/** Başlık satırı: mini logo (yoksa baş harfli kimlik karosu) + ad + ok. */
function CardTitleRow({ name, club }: { name: string; club?: Club }) {
  return (
    <div className="p-4 flex items-center gap-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl
                    font-display text-base font-extrabold ring-1 ring-black/5 ${clubIdentity(name).soft}`}
      >
        {club?.logoUrl ? (
          <img src={club.logoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          clubInitial(name)
        )}
      </span>
      <h3 className="flex-1 truncate font-display font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
        {name}
      </h3>
      <Icon name="arrowRight" size={18} className="text-brand-700 group-hover:translate-x-1 transition-transform duration-300 shrink-0" />
    </div>
  );
}

export function MembershipCard({ membership, club }: { membership: ClubMembership; club?: Club }) {
  const { role, status } = membership;
  const name = membership.club.name;
  return (
    <TiltCard maxTilt={6} className="rounded-3xl h-full">
      <Link to={`/clubs/${membership.club.id}`} className="card-hover overflow-hidden flex flex-col h-full group">
        <CardCover name={name} club={club}>
          {status === "approved" ? (
            <span className="absolute top-3 left-4 glass-dark rounded-full px-3 py-1 text-xs font-bold text-white inline-flex items-center gap-1.5">
              <Icon name={CLUB_ROLE_ICONS[role]} size={13} /> {CLUB_ROLE_LABELS[role]}
            </span>
          ) : (
            <span className="absolute top-3 left-4 glass-dark rounded-full px-3 py-1 text-xs font-bold text-white animate-pulse-soft inline-flex items-center gap-1.5">
              <Icon name="pending" size={13} /> Onay bekliyor
            </span>
          )}
        </CardCover>
        <CardTitleRow name={name} club={club} />
      </Link>
    </TiltCard>
  );
}

/** Danışmanlık kulüp ÜYELİĞİ değildir (clubAdvisors, FRONTEND_CLUBS.md §10) — ayrı kart. */
export function AdvisedClubCard({ advised, club }: { advised: AdvisedClub; club?: Club }) {
  const name = advised.club.name;
  return (
    <TiltCard maxTilt={6} className="rounded-3xl h-full">
      <Link to={`/clubs/${advised.club.id}`} className="card-hover overflow-hidden flex flex-col h-full group">
        <CardCover name={name} club={club}>
          <span className="absolute top-3 left-4 glass-dark rounded-full px-3 py-1 text-xs font-bold text-white inline-flex items-center gap-1.5">
            <Icon name="advisor" size={13} /> Danışman
          </span>
        </CardCover>
        <CardTitleRow name={name} club={club} />
      </Link>
    </TiltCard>
  );
}
