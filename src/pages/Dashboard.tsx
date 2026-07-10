import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCountUp } from "@/shared/hooks/useCountUp";
import { useStreak } from "@/shared/hooks/useStreak";
import { AchievementsCard } from "@/pages/dashboard/AchievementsCard";
import { ProfileStrengthCard, profileCompletion } from "@/pages/dashboard/ProfileStrengthCard";
import { AdvisedClubCard, MembershipCard } from "@/pages/dashboard/ClubCards";
import { getAvailableClubs } from "@/features/clubs/api/clubs";
import PageLoader from "@/shared/ui/PageLoader";
import Reveal from "@/shared/ui/Reveal";
import TiltCard from "@/shared/ui/TiltCard";
import AuroraBackground from "@/shared/ui/AuroraBackground";
import Cube3D from "@/shared/ui/Cube3D";
import { Icon, type IconName } from "@/shared/ui/Icon";

function greetingByHour(hour: number): string {
  if (hour < 6) return "İyi geceler";
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  if (hour < 22) return "İyi akşamlar";
  return "İyi geceler";
}

/** Her gün değişen tek satırlık mikro-mesaj — güne göre deterministik,
 *  böylece sayfa yenilendikçe zıplamaz. */
const DAILY_LINES = [
  "Bugün yeni birileriyle tanışmak için harika bir gün.",
  "Küçük bir adım yeter: bir kulübün sayfasına göz at.",
  "Kampüste olup biteni sen kaçırmazsın, biliyoruz.",
  "Yeni bir kulüp keşfetmenin tam zamanı.",
  "Sosyalleşmek de bir süper güç — kullan.",
  "Bugün sahne senin.",
  "Yeni hafta, yeni topluluklar, yeni hikâyeler.",
];

function dailyLine(date: Date): string {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000);
  return DAILY_LINES[dayOfYear % DAILY_LINES.length];
}

function StatCard({ icon, value, label, delay }: { icon: IconName; value: number; label: string; delay: number }) {
  const animated = useCountUp(value);
  return (
    <Reveal delay={delay}>
      <TiltCard className="rounded-3xl h-full">
        <div className="card-hover p-6 h-full flex items-center gap-4">
          <div className="icon-tile w-14 h-14"><Icon name={icon} size={26} className="text-brand-600" /></div>
          <div className="min-w-0">
            <p className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-800 to-accent-600">
              {animated}
            </p>
            <p className="text-sm text-slate-500 font-medium">{label}</p>
          </div>
        </div>
      </TiltCard>
    </Reveal>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, roleNames, status, clubMemberships, advisedClubs, isLoading } = useAuth();
  const streak = useStreak();

  // Üyelik satırları logo/kapak taşımaz (ClubSummary); görselleri kulüp
  // listesinden eşleriz. Clubs sayfasıyla aynı anahtar — cache paylaşılır.
  const { data: allClubs } = useQuery({
    queryKey: ["clubs"],
    queryFn: () => getAvailableClubs(),
    enabled: !!user,
  });
  const clubById = new Map((allClubs ?? []).map((c) => [c.id, c]));

  if (isLoading) {
    return <PageLoader label="Panelin hazırlanıyor..." />;
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="card p-10 text-center max-w-md animate-scale-in">
          <Icon name="pending" size={40} className="mx-auto mb-4 text-brand-500" />
          <p className="text-slate-700 font-semibold mb-6">Oturum süreniz dolmuş olabilir.</p>
          <button onClick={() => navigate("/login")} className="btn-primary w-full">
            Tekrar Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  // Yetki/sayım kararlarında yalnızca onaylı üyelikler geçerlidir (§5.4)
  const approved = clubMemberships.filter((m) => m.status === "approved");
  const pending = clubMemberships.filter((m) => m.status === "pending");
  const leadership = approved.filter((m) => m.role !== "member");

  const quickActions: { icon: IconName; title: string; desc: string; to: string | null }[] = [
    { icon: "explore", title: "Kulüpleri Keşfet", desc: "Yeni topluluklar bul", to: "/clubs" },
    { icon: "profile", title: "Profilim", desc: "Bilgilerini düzenle", to: "/profile" },
    { icon: "member", title: "Etkinlikler", desc: "Çok yakında", to: null },
    { icon: "announcement", title: "Duyurular", desc: "Çok yakında", to: null },
  ];

  return (
    <div className="space-y-10">

      {/* ====== HERO: karşılama sahnesi ====== */}
      <Reveal>
        <div className="relative overflow-hidden rounded-5xl bg-aurora bg-300% animate-aurora px-8 py-12 md:px-14 shadow-glow-lg">
          <AuroraBackground variant="dark" />

          <div className="relative z-10 grid lg:grid-cols-[1fr_auto] gap-10 items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {user.university && (
                  <span className="glass-dark rounded-full px-4 py-1.5 text-xs font-bold text-white inline-flex items-center gap-1.5">
                    <Icon name="campus" size={13} /> {user.university.name}
                  </span>
                )}
                <span className="glass-dark rounded-full px-4 py-1.5 text-xs font-bold text-white capitalize inline-flex items-center gap-1.5">
                  <Icon name="role" size={13} /> {roleNames.join(", ") || "student"}
                </span>
                {/* Günlük seri — bugün girişle uzadıysa küçük bir kutlama sallanışı */}
                <span
                  className="glass-dark rounded-full px-4 py-1.5 text-xs font-bold text-amber-300 inline-flex items-center gap-1.5"
                  title="Üst üste her gün girdikçe serin uzar"
                >
                  <Icon name="flame" size={13} className={streak.extendedToday ? "animate-wiggle" : ""} />
                  {streak.count} günlük seri
                </span>
              </div>

              <h1 className="font-display text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {greetingByHour(new Date().getHours())},<br />
                <span className="text-accent-300">{user.firstName}.</span>
              </h1>
              <p className="text-blue-100/90 mt-4 max-w-lg text-lg">
                {approved.length > 0
                  ? `${approved.length} kulüpte aktifsin${leadership.length > 0 ? ` — ${leadership.length} tanesinde yönetimdesin` : ""}. Kampüs seni bekliyor.`
                  : "Henüz bir kulübe katılmadın. İlk adımı bugün at, topluluğunu bul."}
              </p>
              <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-accent-200">
                <Icon name="sparkles" size={14} /> {dailyLine(new Date())}
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/clubs" className="btn-white">Kulüpleri Keşfet <Icon name="arrowRight" size={16} /></Link>
                {pending.length > 0 && (
                  <span className="glass-dark rounded-xl px-5 py-3 text-sm font-bold text-white animate-pulse-soft inline-flex items-center gap-2">
                    <Icon name="pending" size={16} /> {pending.length} üyelik isteğin onay bekliyor
                  </span>
                )}
              </div>
            </div>

            <div className="hidden lg:flex flex-col items-center gap-6 pr-6">
              <Cube3D size={130} />
              <p className="text-xs font-bold text-blue-200/60 tracking-widest uppercase">UniClub</p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ====== SAYAÇLI İSTATİSTİKLER ====== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard icon="university" value={approved.length} label="Aktif Kulüp Üyeliği" delay={0} />
        <StatCard icon="president" value={leadership.length} label="Yönetici / Başkanlık" delay={100} />
        <StatCard icon="pending" value={pending.length} label="Bekleyen İstek" delay={200} />
      </div>

      {/* ====== HIZLI AKSİYONLAR ====== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, i) => (
          <Reveal key={action.title} delay={i * 80}>
            {action.to ? (
              <Link
                to={action.to}
                className="card-hover p-5 flex items-center gap-4 group h-full"
              >
                <div className="icon-tile group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 ease-bounce-soft">
                  <Icon name={action.icon} size={24} className="text-brand-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-display font-bold text-slate-900 text-sm truncate">{action.title}</p>
                  <p className="text-xs text-slate-500 truncate">{action.desc}</p>
                </div>
              </Link>
            ) : (
              <div className="card p-5 flex items-center gap-4 opacity-60 cursor-not-allowed h-full">
                <div className="icon-tile grayscale">
                  <Icon name={action.icon} size={24} className="text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-display font-bold text-slate-500 text-sm truncate">{action.title}</p>
                  <p className="text-xs text-slate-400 truncate">{action.desc}</p>
                </div>
              </div>
            )}
          </Reveal>
        ))}
      </div>

      {/* ====== KULÜPLERİM + HESAP ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        <div className="lg:col-span-2">
          <Reveal>
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="badge mb-2">Topluluğun</span>
                <h2 className="font-display text-2xl font-extrabold text-slate-900">Kulüplerim</h2>
              </div>
              <Link to="/clubs" className="btn-ghost text-sm">Keşfet <Icon name="arrowRight" size={15} /></Link>
            </div>
          </Reveal>

          {clubMemberships.length === 0 ? (
            <Reveal delay={100}>
              <div className="card-gradient p-12 text-center">
                <Icon name="explore" size={56} className="mx-auto mb-5 animate-float text-brand-500" />
                <h3 className="font-display text-xl font-bold text-slate-900 mb-2">Macera burada başlıyor</h3>
                <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">
                  Kampüsteki 120'den fazla topluluktan biri kesin sana göre. Müzikten robotiğe, keşfetmeye başla.
                </p>
                <Link to="/clubs" className="btn-primary">Kulüpleri Keşfet</Link>
              </div>
            </Reveal>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {clubMemberships.map((m, i) => (
                <Reveal key={m.clubId} delay={100 + i * 80}>
                  <MembershipCard membership={m} club={clubById.get(m.clubId)} />
                </Reveal>
              ))}
            </div>
          )}

          {/* Danışmanlıklar — yalnızca advisor rolünde dolu gelir (§10) */}
          {advisedClubs.length > 0 && (
            <>
              <Reveal>
                <div className="mt-10 mb-6">
                  <span className="badge mb-2">Gözetimindeki topluluklar</span>
                  <h2 className="font-display text-2xl font-extrabold text-slate-900">Danışmanlıklarım</h2>
                </div>
              </Reveal>
              <div className="grid sm:grid-cols-2 gap-5">
                {advisedClubs.map((a, i) => (
                  <Reveal key={a.clubId} delay={100 + i * 80}>
                    <AdvisedClubCard advised={a} club={clubById.get(a.clubId)} />
                  </Reveal>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Hesap özeti + oyunlaştırma sütunu */}
        <div className="space-y-6">
        <Reveal delay={200}>
          <div className="card-gradient p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-400 text-white flex items-center justify-center font-display text-xl font-extrabold shadow-glow overflow-hidden shrink-0">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  user.firstName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-slate-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>

            <dl className="space-y-4 mb-8">
              {([
                ["campus", "Üniversite", user.university?.name ?? "Belirtilmemiş"],
                ["department", "Bölüm", user.department?.name ?? "Belirtilmemiş"],
                ["studentNumber", "Öğrenci No", user.studentNumber ?? "Belirtilmemiş"],
              ] as [IconName, string, string][]).map(([icon, label, value]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                    <Icon name={icon} size={17} />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{label}</dt>
                    <dd className="text-sm font-semibold text-slate-700 truncate">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>

            <Link to="/profile" className="btn-secondary w-full">Profili Düzenle</Link>
          </div>
        </Reveal>

        <Reveal delay={300}>
          <ProfileStrengthCard user={user} />
        </Reveal>

        <Reveal delay={400}>
          <AchievementsCard
            memberships={clubMemberships}
            status={status}
            profilePercent={profileCompletion(user).percent}
          />
        </Reveal>
        </div>
      </div>
    </div>
  );
}
