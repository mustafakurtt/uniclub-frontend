import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getUniversityAnnouncement } from "@/features/university-announcements/api/universityAnnouncements";
import { universityAnnouncementQueryKey } from "@/features/university-announcements/queries";
import { formatEditedAtLabel } from "@/shared/lib/announcementEdited";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getErrorMessage } from "@/shared/api/client";
import PageLoader from "@/shared/ui/PageLoader";
import { Icon } from "@/shared/ui/Icon";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NotFoundView() {
  return (
    <div className="card p-8 text-center">
      <Icon name="notFound" size={36} className="mx-auto mb-3 text-brand-500" />
      <p className="font-semibold text-slate-700">Duyuru bulunamadı veya yayında değil.</p>
      <Link to="/duyurular" className="btn-primary mt-4 inline-flex">
        Listeye dön
      </Link>
    </div>
  );
}

export default function UniversityAnnouncementDetailPage() {
  const { announcementId = "" } = useParams();
  const { user } = useAuth();
  const universityId = user?.universityId ?? "";

  const announcementQuery = useQuery({
    queryKey: universityAnnouncementQueryKey(universityId, announcementId),
    queryFn: () => getUniversityAnnouncement(universityId, announcementId),
    enabled: !!universityId && !!announcementId,
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) return false;
      return failureCount < 3;
    },
  });

  if (!universityId) {
    return (
      <div className="card p-8 text-center text-slate-600">
        Bu hesap bir üniversiteye bağlı değil.
      </div>
    );
  }

  if (announcementQuery.isLoading) {
    return <PageLoader label="Duyuru yükleniyor…" />;
  }

  if (announcementQuery.isError) {
    if (axios.isAxiosError(announcementQuery.error) && announcementQuery.error.response?.status === 404) {
      return <NotFoundView />;
    }

    return (
      <div className="alert-error">
        {getErrorMessage(announcementQuery.error, "Duyuru yüklenemedi.")}
      </div>
    );
  }

  const announcement = announcementQuery.data;
  if (!announcement) {
    return <PageLoader label="Duyuru yükleniyor…" />;
  }

  const editedLabel = formatEditedAtLabel(announcement.editedAt);

  return (
    <article className="space-y-6">
      <div>
        <Link
          to="/duyurular"
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-700"
        >
          <Icon name="arrowLeft" size={16} /> Okul duyuruları
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <h1 className="font-display text-3xl font-extrabold text-slate-900">
            {announcement.title}
          </h1>
          {announcement.pinned && (
            <span className="chip gap-1 bg-amber-100 text-xs text-amber-800">
              <Icon name="pin" size={12} /> Sabit duyuru
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {announcement.author
            ? `${announcement.author.firstName} ${announcement.author.lastName} · `
            : ""}
          {announcement.publishedAt
            ? formatDate(announcement.publishedAt)
            : formatDate(announcement.createdAt)}
          {editedLabel && <span className="text-slate-400"> · {editedLabel}</span>}
        </p>
      </div>

      <div className="card whitespace-pre-line p-6 text-sm leading-relaxed text-slate-700">
        {announcement.content}
      </div>
    </article>
  );
}
