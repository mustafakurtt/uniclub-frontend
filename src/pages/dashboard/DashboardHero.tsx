import { Link } from "react-router-dom";
import Cube3D from "@/shared/ui/Cube3D";
import { Icon } from "@/shared/ui/Icon";
import type { University } from "@/shared/types";
import { resolveDashboardHeroUrl } from "@/pages/dashboard/dashboardHeroBranding";

interface DashboardHeroProps {
  firstName: string;
  university: University | null;
  pendingMembershipCount: number;
}

/**
 * Kurum görseli + okunabilirlik şeridi.
 * Mobil: sabit yükseklik + dikey şerit (alttan üste koyu).
 * Masaüstü: 3:1 oran + yatay şerit (soldan sağa koyu → şeffaf).
 */
export default function DashboardHero({
  firstName,
  university,
  pendingMembershipCount,
}: DashboardHeroProps) {
  const heroUrl = resolveDashboardHeroUrl(university);
  const hasHeroImage = heroUrl != null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-5xl shadow-glow-lg
        h-[13.5rem] min-[380px]:h-56 sm:h-60
        lg:h-auto lg:max-h-[17.5rem] lg:aspect-[3/1]"
    >
      {hasHeroImage ? (
        <img
          src={heroUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          decoding="async"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 bg-aurora bg-300% animate-aurora"
        />
      )}

      {/* Okunabilirlik şeridi — mobil dikey, masaüstü yatay (metin sol %55 güvenli alan). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/92 via-slate-950/72 to-slate-950/35 lg:bg-none"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          background:
            "linear-gradient(to right, rgba(2, 6, 23, 0.9) 0%, rgba(2, 6, 23, 0.78) 38%, rgba(2, 6, 23, 0.45) 55%, rgba(2, 6, 23, 0.12) 72%, transparent 100%)",
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-end px-5 py-6 min-[380px]:px-6 sm:px-8 sm:py-8 lg:grid lg:grid-cols-[minmax(0,55%)_minmax(0,45%)] lg:items-center lg:gap-8 lg:px-10 lg:py-10 xl:px-14">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-4">
            {university && (
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm sm:px-4 sm:py-1.5 sm:text-xs">
                <Icon name="campus" size={13} className="shrink-0" />
                <span className="truncate">{university.name}</span>
              </span>
            )}
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 lg:hidden">
              UniClub
            </span>
          </div>

          <h1 className="font-display text-[1.65rem] font-extrabold leading-tight tracking-tight text-white min-[380px]:text-3xl sm:text-4xl lg:text-5xl">
            Hoş geldin, <span className="text-accent-300">{firstName}.</span>
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-6 sm:gap-4">
            <Link to="/activities" className="btn-white text-sm sm:text-base">
              Bu hafta ne var? <Icon name="arrowRight" size={16} />
            </Link>
            {pendingMembershipCount > 0 && (
              <span className="inline-flex max-w-full items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold text-white backdrop-blur-sm animate-pulse-soft sm:px-4 sm:py-3 sm:text-sm">
                <Icon name="pending" size={16} className="shrink-0" />
                <span className="truncate">
                  {pendingMembershipCount} üyelik isteğin onay bekliyor
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="hidden lg:flex flex-col items-center justify-center gap-4 pr-2">
          <Cube3D size={130} />
          <p className="text-xs font-bold tracking-widest text-white/70 uppercase">UniClub</p>
        </div>
      </div>
    </div>
  );
}
