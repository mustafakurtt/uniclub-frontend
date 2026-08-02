import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdvisedClubCard } from "@/pages/dashboard/ClubCards";
import ActiveProcessesCard from "@/pages/dashboard/ActiveProcessesCard";
import CampusFeed from "@/pages/dashboard/CampusFeed";
import DashboardHero from "@/pages/dashboard/DashboardHero";
import { getAvailableClubs } from "@/features/clubs/api/clubs";
import PageLoader from "@/shared/ui/PageLoader";
import Reveal from "@/shared/ui/Reveal";
import { Icon } from "@/shared/ui/Icon";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, clubMemberships, advisedClubs, isLoading, isAdmin } = useAuth();

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

  const pending = clubMemberships.filter((m) => m.status === "pending");

  return (
    <div className="space-y-10">
      <Reveal>
        <DashboardHero
          firstName={user.firstName}
          university={user.university}
          pendingMembershipCount={pending.length}
        />
      </Reveal>

      <ActiveProcessesCard userId={user.id} />

      {isAdmin && (
        <Reveal>
          <Link
            to="/admin"
            className="card-hover group flex items-center gap-4 p-5 transition-all sm:p-6"
          >
            <span className="icon-tile shrink-0">
              <Icon name="officer" size={24} className="text-brand-600" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-extrabold text-slate-900 transition-colors group-hover:text-brand-700">
                Yönetim paneli
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Başvurular, kulüpler, kullanıcılar ve kurumsal ayarlar burada.
              </p>
            </div>
            <Icon
              name="chevronRight"
              size={22}
              className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600"
            />
          </Link>
        </Reveal>
      )}

      <Reveal>
        <CampusFeed />
      </Reveal>

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
