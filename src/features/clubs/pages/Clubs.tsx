import { useMemo, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getAvailableClubs } from "@/features/clubs/api/clubs";
import { clubIdentity, clubInitial } from "@/features/clubs/clubIdentity";
import type { Club, JoinPolicy } from "@/shared/types";
import Reveal from "@/shared/ui/Reveal";
import { Icon } from "@/shared/ui/Icon";

type PolicyFilter = "all" | JoinPolicy;

const POLICY_FILTERS: { key: PolicyFilter; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "open", label: "Herkese Açık" },
  { key: "approval_required", label: "Onaylı" },
];

function ClubCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-3.5 shadow-card">
      <div className="skeleton h-20 w-20 shrink-0 rounded-2xl" />
      <div className="flex-1 space-y-2.5">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-5 w-28 rounded-full" />
      </div>
    </div>
  );
}

/** Yatay, kompakt kulüp kartı. Az kulüp olduğunda grid'i boş göstermez ve
 *  telefonda tek elle taranabilir. Renk kimliği kulüp adından türer. */
function ClubCard({ club }: { club: Club }) {
  const id = clubIdentity(club.name);
  const isOpen = club.joinPolicy === "open";

  return (
    <Link
      to={`/clubs/${club.id}`}
      className={`card-pop group flex items-center gap-3.5 p-3.5 sm:gap-4 sm:p-4 ${id.glow}`}
    >
      {/* Kimlik karosu — logo yoksa baş harf + ince grid dokusu */}
      <div
        className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br ${id.grad} shadow-inner-light transition-transform duration-500 ease-spring group-hover:-rotate-3 group-hover:scale-105`}
      >
        {club.logoUrl ? (
          <img src={club.logoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-grid-fine-dark bg-grid-sm opacity-40" aria-hidden />
            <span
              aria-hidden
              className="absolute inset-0 flex items-center justify-center font-display text-4xl font-extrabold text-white drop-shadow"
            >
              {clubInitial(club.name)}
            </span>
          </>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="truncate font-display text-base font-extrabold text-slate-900 transition-colors group-hover:text-brand-700 sm:text-lg">
          {club.name}
        </h2>
        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 sm:text-sm">
          {club.description || "Henüz açıklama eklenmemiş."}
        </p>
        <span
          className={`sticker mt-2 -rotate-2 ${
            isOpen ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
          }`}
        >
          <Icon name={isOpen ? "policyOpen" : "policyApproval"} size={11} strokeWidth={2.75} />
          {isOpen ? "Açık" : "Onaylı"}
        </span>
      </div>

      <Icon
        name="chevronRight"
        size={20}
        className="shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-600"
      />
    </Link>
  );
}

export default function Clubs() {
  const { clubMemberships } = useAuth();
  const [search, setSearch] = useState("");
  const [policyFilter, setPolicyFilter] = useState<PolicyFilter>("all");

  const { data: clubs, isLoading, isError, refetch } = useQuery({
    queryKey: ["clubs"],
    // Tüm liste çekilir; arama/filtre istemci tarafında yapılır (?search= ucu
    // liste büyürse sunucu tarafına taşınabilir).
    queryFn: () => getAvailableClubs(),
  });

  const filteredClubs = useMemo(() => {
    if (!clubs) return [];
    const q = search.trim().toLocaleLowerCase("tr-TR");
    return clubs.filter((c) => {
      if (policyFilter !== "all" && c.joinPolicy !== policyFilter) return false;
      if (!q) return true;
      return (
        c.name.toLocaleLowerCase("tr-TR").includes(q) ||
        (c.description ?? "").toLocaleLowerCase("tr-TR").includes(q)
      );
    });
  }, [clubs, search, policyFilter]);

  // Liste ikiye ayrılır: üyesi olduğun kulüpler ve henüz olmadıkların.
  // Dashboard'daki "Kulüplerim" bloğu kaldırıldı; kulüp yönetimi tek yerde.
  const myClubIds = useMemo(
    () => new Set(clubMemberships.filter((m) => m.status === "approved").map((m) => m.clubId)),
    [clubMemberships]
  );
  const myClubs = useMemo(
    () => filteredClubs.filter((c) => myClubIds.has(c.id)),
    [filteredClubs, myClubIds]
  );
  const otherClubs = useMemo(
    () => filteredClubs.filter((c) => !myClubIds.has(c.id)),
    [filteredClubs, myClubIds]
  );

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="card-gradient max-w-md animate-scale-in p-10 text-center">
          <Icon name="offline" size={40} className="mx-auto mb-4 text-brand-500" />
          <p className="mb-2 font-semibold text-slate-700">Kulüpler yüklenirken bir hata oluştu.</p>
          <p className="mb-6 text-sm text-slate-400">Bağlantını kontrol edip tekrar deneyebilirsin.</p>
          <button onClick={() => refetch()} className="btn-primary w-full">Tekrar Dene</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ====== Kompakt başlık — tek satır mesaj, okuma yükü yok ====== */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Topluluğunu <span className="text-gradient">bul.</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/clubs/proposals" className="btn-secondary text-sm">
            <Icon name="seedling" size={16} /> Kuruluş Önerileri
          </Link>
          <Link to="/clubs/new" className="btn-primary text-sm">
            <Icon name="add" size={16} /> Kulüp Kur
          </Link>
        </div>
      </div>

      {/* ====== Arama — büyük dokunma hedefi, temizleme butonlu ====== */}
      <div className="relative">
        <Icon
          name="search"
          size={20}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kulüp ara..."
          aria-label="Kulüp ara"
          className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 font-semibold text-slate-800 shadow-card outline-none transition-all duration-300 placeholder:font-normal placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="Aramayı temizle"
            className="tap absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </div>

      {/* ====== Filtre şeridi + sonuç sayısı ====== */}
      <div className="flex items-center justify-between gap-3">
        <div className="chip-rail">
          {POLICY_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setPolicyFilter(f.key)}
              aria-pressed={policyFilter === f.key}
              className="chip-filter"
            >
              {f.label}
            </button>
          ))}
        </div>
        {!isLoading && (
          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
            {filteredClubs.length}
          </span>
        )}
      </div>

      {/* ====== Liste ====== */}
      {isLoading ? (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <ClubCardSkeleton key={i} />)}
        </div>
      ) : filteredClubs.length === 0 ? (
        <div className="card-gradient animate-scale-in p-10 text-center sm:p-14">
          <Icon
            name={search || policyFilter !== "all" ? "notFound" : "seedling"}
            size={48}
            className="mx-auto mb-4 animate-float text-brand-500"
          />
          <p className="mb-1 font-display text-lg font-bold text-slate-700 sm:text-xl">
            {search ? `"${search}" bulunamadı.` : "Henüz kulüp yok."}
          </p>
          <p className="text-sm text-slate-400">
            {search || policyFilter !== "all"
              ? "Başka bir arama dene."
              : "Çok yakında burası şenlenecek!"}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {myClubs.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-xl font-extrabold text-slate-900">
                Kulüplerim
                <span className="ml-2 align-middle rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                  {myClubs.length}
                </span>
              </h2>
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                {myClubs.map((club, i) => (
                  <Reveal key={club.id} delay={Math.min(i, 5) * 60}>
                    <ClubCard club={club} />
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-4 font-display text-xl font-extrabold text-slate-900">
              {myClubs.length > 0 ? "Keşfet" : "Tüm kulüpler"}
              <span className="ml-2 align-middle rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">
                {otherClubs.length}
              </span>
            </h2>
            {otherClubs.length === 0 ? (
              <p className="card p-8 text-center text-sm text-slate-500">
                Bu filtreye uyan, henüz üyesi olmadığın kulüp yok.
              </p>
            ) : (
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                {otherClubs.map((club, i) => (
                  <Reveal key={club.id} delay={Math.min(i, 5) * 60}>
                    <ClubCard club={club} />
                  </Reveal>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
