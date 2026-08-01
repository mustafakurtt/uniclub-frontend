import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdvisedClubCard } from "@/pages/dashboard/ClubCards";
import ActiveProcessesCard from "@/pages/dashboard/ActiveProcessesCard";
import CampusFeed from "@/pages/dashboard/CampusFeed";
import { getAvailableClubs } from "@/features/clubs/api/clubs";
import PageLoader from "@/shared/ui/PageLoader";
import Reveal from "@/shared/ui/Reveal";
import AuroraBackground from "@/shared/ui/AuroraBackground";
import Cube3D from "@/shared/ui/Cube3D";
import { Icon } from "@/shared/ui/Icon";

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, roleNames, clubMemberships, advisedClubs, isLoading } = useAuth();

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

      <ActiveProcessesCard userId={user.id} />

      {/* ====== KAMPÜS AKIŞI — sayfanın merkezi ======
          Sayaç kartları, hızlı eylem kutuları, profil özeti ve "Kulüplerim"
          bloğu kaldırıldı: sayaçlar zaten hero'da yazılı, profil bilgisi
          /profile'da, kulüpler /clubs sekmesinde ikiye bölünmüş halde. */}
      <Reveal>
        <CampusFeed />
      </Reveal>

      {/* Danışmanlıklar — yalnızca advisor rolünde dolu gelir (§10) */}
      {advisedClubs.length > 0 && (
        <section>
          <Reveal>
            <h2 className="font-display text-2xl font-extrabold text-slate-900 mb-6">
              Danışmanlıklarım
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-5">
            {advisedClubs.map((a, i) => (
              <Reveal key={a.clubId} delay={100 + i * 80}>
                <AdvisedClubCard advised={a} club={clubById.get(a.clubId)} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
