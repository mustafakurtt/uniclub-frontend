import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listUniversityAnnouncements } from "@/features/university-announcements/api/universityAnnouncements";
import { universityAnnouncementsQueryKey } from "@/features/university-announcements/queries";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getErrorMessage } from "@/shared/api/client";
import PageLoader from "@/shared/ui/PageLoader";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function UniversityAnnouncementsPage() {
  const { user } = useAuth();
  const universityId = user?.universityId ?? "";

  const announcementsQuery = useQuery({
    queryKey: universityAnnouncementsQueryKey(universityId),
    queryFn: () => listUniversityAnnouncements(universityId),
    enabled: !!universityId,
  });

  if (!universityId) {
    return (
      <EmptyState
        icon="university"
        title="Okul duyuruları kullanılamıyor"
        description="Bu hesap bir üniversiteye bağlı değil."
      />
    );
  }

  if (announcementsQuery.isLoading) {
    return <PageLoader label="Okul duyuruları yükleniyor…" />;
  }

  if (announcementsQuery.isError) {
    return (
      <div className="alert-error">
        {getErrorMessage(announcementsQuery.error, "Duyurular yüklenemedi.")}
      </div>
    );
  }

  const published = (announcementsQuery.data ?? []).filter((a) => a.status === "published");
  const pinned = published.filter((a) => a.pinned);
  const rest = published.filter((a) => !a.pinned);
  const ordered = [...pinned, ...rest];

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-700"
        >
          <Icon name="arrowLeft" size={16} /> Ana sayfa
        </Link>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-slate-900">
          Okul duyuruları
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {user?.university?.name ?? "Üniversiteniz"} tarafından yayınlanan resmi duyurular.
        </p>
      </div>

      {ordered.length === 0 ? (
        <EmptyState icon="announcement" title="Henüz yayınlanmış duyuru yok" />
      ) : (
        <ul className="space-y-4">
          {ordered.map((item) => (
            <li key={item.id}>
              <Link
                to={`/duyurular/${item.id}`}
                className={`card-hover block p-5 ${
                  item.pinned ? "border-amber-200/80 bg-amber-50/30" : ""
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg font-bold text-slate-900">{item.title}</h2>
                  {item.pinned && (
                    <span className="chip gap-1 bg-amber-100 text-[10px] text-amber-800">
                      <Icon name="pin" size={11} /> Sabit
                    </span>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.content}</p>
                <p className="mt-3 text-[11px] font-semibold text-slate-400">
                  {item.publishedAt ? formatDate(item.publishedAt) : formatDate(item.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
