import { useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import AuroraBackground from "@/shared/ui/AuroraBackground";
import Cube3D from "@/shared/ui/Cube3D";
import TiltCard from "@/shared/ui/TiltCard";
import Reveal from "@/shared/ui/Reveal";
import { Icon, type IconName } from "@/shared/ui/Icon";
import LanguageSwitcher from "@/shared/ui/LanguageSwitcher";

const CATEGORIES: { icon: IconName; label: string }[] = [
  { icon: "music", label: "Müzik" },
  { icon: "robotics", label: "Robotik" },
  { icon: "theatre", label: "Tiyatro" },
  { icon: "sports", label: "Spor" },
  { icon: "photography", label: "Fotoğrafçılık" },
  { icon: "ai", label: "Yapay Zeka" },
  { icon: "erasmus", label: "Erasmus" },
  { icon: "literature", label: "Edebiyat" },
  { icon: "esports", label: "E-Spor" },
  { icon: "arts", label: "Güzel Sanatlar" },
  { icon: "entrepreneurship", label: "Girişimcilik" },
  { icon: "environment", label: "Çevre" },
  { icon: "debate", label: "Münazara" },
  { icon: "science", label: "Bilim" },
  { icon: "dance", label: "Dans" },
];

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "explore",
    title: "Kulübünü Keşfet",
    text: "İlgi alanlarına göre filtrele, kampüsündeki 120+ kulüp arasından sana en uygun olanı saniyeler içinde bul.",
  },
  {
    icon: "member",
    title: "Etkinliklere Katıl",
    text: "Konserden hackathon'a tüm kampüs etkinliklerini tek takvimde gör, tek tıkla yerini ayırt.",
  },
  {
    icon: "announcement",
    title: "Duyuruları Kaçırma",
    text: "Üyesi olduğun kulüplerin duyuruları anında sana ulaşır. Bir daha 'haberim olmadı' demek yok.",
  },
  {
    icon: "handshake",
    title: "Topluluğunu Bul",
    text: "Aynı şeylere heyecanlanan insanlarla tanış. Üniversite sadece dersten ibaret değil.",
  },
  {
    icon: "university",
    title: "Kulübünü Yönet",
    text: "Başkan ve yöneticiler için üye, etkinlik ve duyuru yönetimi tek panelde, kağıt işi sıfır.",
  },
  {
    icon: "campus",
    title: "Her Üniversiteye Uygun",
    text: "Her üniversite kendi alan adında, kendi renkleriyle. UniClub altyapısı seninkine de kurulabilir.",
  },
];

const STEPS = [
  { no: "01", title: "Hesabını oluştur", text: "Okul e-postanla 1 dakikada kayıt ol, profilini tamamla." },
  { no: "02", title: "Kulüplere göz at", text: "Kategorilere göre keşfet, merak ettiğin kulübün sayfasını incele." },
  { no: "03", title: "Katıl ve yaşa", text: "Üyelik isteğini gönder, etkinliklere katıl, kampüsün bir parçası ol." },
];

const SAMPLE_CLUBS: { icon: IconName; name: string; members: number; tag: string; gradient: string }[] = [
  { icon: "robotics", name: "Robotik & Yapay Zeka", members: 340, tag: "Teknoloji", gradient: "from-brand-600 to-accent-500" },
  { icon: "music", name: "Müzik Kulübü", members: 512, tag: "Sanat", gradient: "from-brand-800 to-brand-500" },
  { icon: "entrepreneurship", name: "Girişimcilik", members: 287, tag: "Kariyer", gradient: "from-accent-600 to-brand-600" },
  { icon: "sports", name: "Spor Topluluğu", members: 623, tag: "Spor", gradient: "from-brand-700 to-accent-400" },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();

  // İmleci takip eden spotlight — hero'nun "canlı" hissetmesi için.
  // State yerine doğrudan style yazılır: her mouse-move'da render tetiklenmez.
  const spotlightRef = useRef<HTMLDivElement>(null);
  const onHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const spotlight = spotlightRef.current;
    if (!spotlight) return;
    const rect = e.currentTarget.getBoundingClientRect();
    spotlight.style.background = `radial-gradient(360px circle at ${e.clientX - rect.left}px ${e.clientY - rect.top}px, rgba(59, 130, 246, 0.14), transparent 70%)`;
    spotlight.style.opacity = "1";
  };
  const onHeroMouseLeave = () => {
    if (spotlightRef.current) spotlightRef.current.style.opacity = "0";
  };

  return (
    <div className="min-h-screen bg-club-light overflow-x-hidden">

      {/* ============ NAVBAR (cam efektli, yapışkan) ============ */}
      <header className="fixed top-0 inset-x-0 z-50">
        <nav className="glass mx-auto mt-4 max-w-6xl rounded-2xl px-5 sm:px-8 animate-fade-in">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="font-display text-xl font-extrabold text-brand-900 tracking-wide">
              UNI<span className="text-gradient">CLUB</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#ozellikler" className="link-nav">Özellikler</a>
              <a href="#nasil" className="link-nav">Nasıl Çalışır?</a>
              <a href="#kulupler" className="link-nav">Kulüpler</a>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary px-5 py-2.5">Panele Git</Link>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost px-4 py-2.5 hidden sm:inline-flex">Giriş Yap</Link>
                  <Link to="/register" className="btn-primary px-5 py-2.5">Kayıt Ol</Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* ============ HERO ============ */}
      <section
        className="relative pt-40 pb-24 px-6 overflow-hidden bg-hero-radial"
        onMouseMove={onHeroMouseMove}
        onMouseLeave={onHeroMouseLeave}
      >
        <AuroraBackground variant="light" />
        <div
          ref={spotlightRef}
          className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-500"
          aria-hidden
        />

        <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="badge-glow mb-6 animate-fade-up"><Icon name="sparkles" size={14} /> Kampüs hayatının yeni merkezi</span>
            <h1 className="font-display text-5xl md:text-6xl xl:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05] animate-fade-up delay-100">
              Üniversiteni<br />
              <span className="text-gradient">yaşamaya başla.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-500 leading-relaxed max-w-xl animate-fade-up delay-200">
              UniClub, üniversitendeki tüm kulüpleri, etkinlikleri ve duyuruları
              tek çatı altında toplar. Keşfet, katıl, tanış — kampüs senin.
            </p>

            <div className="mt-10 flex flex-wrap gap-4 animate-fade-up delay-300">
              <Link to="/register" className="btn-primary px-8 py-4 text-base">
                Ücretsiz Başla <Icon name="arrowRight" size={18} />
              </Link>
              <a href="#ozellikler" className="btn-secondary px-8 py-4 text-base">
                Keşfet
              </a>
            </div>

            <div className="mt-12 flex items-center gap-8 animate-fade-up delay-500">
              {[
                ["120+", "Aktif Kulüp"],
                ["15K", "Öğrenci"],
                ["300+", "Etkinlik / Yıl"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="font-display text-3xl font-extrabold text-brand-800">{value}</p>
                  <p className="text-sm text-slate-500 font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero görseli: 3D küp + yüzen kartlar */}
          <div className="relative hidden lg:block h-[480px] animate-fade-in delay-300">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <Cube3D size={190} />
            </div>

            <div className="glass rounded-2xl px-5 py-4 absolute top-10 left-4 animate-float shadow-card-hover">
              <p className="text-sm font-bold text-slate-800 inline-flex items-center gap-2"><Icon name="party" size={16} className="text-brand-600" /> Bahar Şenliği</p>
              <p className="text-xs text-slate-500 mt-0.5">Yarın · Ana Kampüs</p>
            </div>

            <div className="glass rounded-2xl px-5 py-4 absolute bottom-16 right-0 animate-float-slow delay-500 shadow-card-hover">
              <p className="text-sm font-bold text-slate-800 inline-flex items-center gap-2"><Icon name="robotics" size={16} className="text-brand-600" /> Robotik Atölyesi</p>
              <p className="text-xs text-slate-500 mt-0.5">28 kontenjan kaldı</p>
            </div>

            <div className="glass rounded-2xl px-5 py-4 absolute top-24 right-8 animate-float-x delay-700 shadow-card-hover">
              <p className="text-sm font-bold text-slate-800 inline-flex items-center gap-2"><Icon name="announcement" size={16} className="text-brand-600" /> Yeni Duyuru</p>
              <p className="text-xs text-slate-500 mt-0.5">Müzik Kulübü · az önce</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ KATEGORİ MARQUEE ============ */}
      <section className="py-6 border-y border-brand-100/60 bg-white/50">
        <div className="mask-fade-x overflow-hidden">
          <div className="marquee-track gap-4 pr-4">
            {[...CATEGORIES, ...CATEGORIES].map((cat, i) => (
              <span key={i} className="chip whitespace-nowrap gap-1.5">
                <Icon name={cat.icon} size={15} className="text-brand-600" /> {cat.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ÖZELLİKLER ============ */}
      <section id="ozellikler" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <span className="badge mb-4">Neden UniClub?</span>
            <h2 className="section-title mb-4">İhtiyacın olan her şey, tek platformda</h2>
            <p className="section-subtitle mx-auto">
              Kulüp aramaktan etkinlik takibine, üyelikten yönetime — kampüs sosyal hayatının tamamı.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 100}>
                <TiltCard className="rounded-3xl h-full">
                  <div className="card-hover p-8 h-full">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-accent-100 flex items-center justify-center text-brand-600 mb-5 shadow-inner-light">
                      <Icon name={f.icon} size={28} />
                    </div>
                    <h3 className="font-display text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
                    <p className="text-slate-500 leading-relaxed text-sm">{f.text}</p>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ NASIL ÇALIŞIR ============ */}
      <section id="nasil" className="py-24 px-6 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-fine bg-grid-md opacity-50" aria-hidden />
        <div className="relative max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <span className="badge mb-4">3 adımda</span>
            <h2 className="section-title mb-4">Nasıl çalışır?</h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <Reveal key={s.no} delay={i * 150}>
                <div className="relative p-8">
                  <span className="font-display text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-brand-200 to-brand-50 select-none">
                    {s.no}
                  </span>
                  <h3 className="font-display text-xl font-bold text-slate-900 -mt-4 mb-2">{s.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{s.text}</p>
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-12 -right-4 text-brand-300 animate-pulse-soft"><Icon name="arrowRight" size={24} /></div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ POPÜLER KULÜPLER ============ */}
      <section id="kulupler" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-12">
            <div>
              <span className="badge mb-4">Topluluk</span>
              <h2 className="section-title">Popüler kulüpler</h2>
            </div>
            <Link to="/register" className="btn-ghost">Tümünü görmek için kayıt ol <Icon name="arrowRight" size={16} /></Link>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SAMPLE_CLUBS.map((club, i) => (
              <Reveal key={club.name} delay={i * 100}>
                <TiltCard className="rounded-3xl h-full">
                  <div className="card-hover overflow-hidden h-full">
                    <div className={`h-28 bg-gradient-to-br ${club.gradient} flex items-center justify-center text-white relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-grid-fine-dark bg-grid-sm opacity-40" aria-hidden />
                      <Icon name={club.icon} size={44} className="relative animate-float" strokeWidth={1.75} />
                    </div>
                    <div className="p-5">
                      <span className="badge mb-3">{club.tag}</span>
                      <h3 className="font-display font-bold text-slate-900">{club.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium inline-flex items-center gap-1.5"><Icon name="members" size={13} /> {club.members} üye</p>
                    </div>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-24 px-6">
        <Reveal className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-5xl bg-aurora bg-300% animate-aurora px-8 py-16 md:px-16 md:py-20 text-center shadow-glow-lg">
            <AuroraBackground variant="dark" />
            <div className="relative z-10">
              <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
                Kampüste bir <span className="text-accent-300">hikâyen</span> olsun.
              </h2>
              <p className="text-blue-100/90 text-lg max-w-xl mx-auto mb-10">
                Binlerce öğrenci çoktan topluluğunu buldu. Sıra sende —
                kayıt ol, kulübünü keşfet, etkinliğine katıl.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/register" className="btn-white px-8 py-4 text-base">Hemen Kayıt Ol</Link>
                <Link to="/login" className="btn px-8 py-4 text-base text-white border border-white/30 hover:bg-white/10 focus-visible:ring-white/30">
                  Giriş Yap
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-brand-100/60 bg-white/60 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="font-display text-xl font-extrabold text-brand-900">
              UNI<span className="text-gradient">CLUB</span>
            </p>
            <p className="text-sm text-slate-500 mt-1">Kampüsün kalbi burada atıyor.</p>
          </div>
          <div className="flex items-center gap-6 text-sm font-semibold text-slate-500">
            <a href="#ozellikler" className="hover:text-brand-700 transition-colors">Özellikler</a>
            <a href="#nasil" className="hover:text-brand-700 transition-colors">Nasıl Çalışır?</a>
            <Link to="/login" className="hover:text-brand-700 transition-colors">Giriş</Link>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} UniClub. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
