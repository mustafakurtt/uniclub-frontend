import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listUniversityAnnouncements } from "@/features/university-announcements/api/universityAnnouncements";
import { universityAnnouncementsQueryKey } from "@/features/university-announcements/queries";
import { formatEditedAtLabel } from "@/shared/lib/announcementEdited";
import { Icon } from "@/shared/ui/Icon";
import Reveal from "@/shared/ui/Reveal";

const PREVIEW_CHARS = 140;
const DASHBOARD_LIMIT = 3;

function previewText(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= PREVIEW_CHARS) return trimmed;
  return `${trimmed.slice(0, PREVIEW_CHARS).trimEnd()}…`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface Props {
  universityId: string;
}

/**
 * Dashboard okul duyuruları — CampusFeed şeridinden ayrı metin bloğu.
 * Yalnızca yayınlanmış duyurular; sabitlenenler üstte (backend sıralaması).
 */
export default function UniversityAnnouncementsBlock({ universityId }: Props) {
  const announcementsQuery = useQuery({
    queryKey: universityAnnouncementsQueryKey(universityId),
    queryFn: () => listUniversityAnnouncements(universityId),
    enabled: !!universityId,
  });

  const published = (announcementsQuery.data ?? []).filter((a) => a.status === "published");

  if (announcementsQuery.isLoading || published.length === 0) {
    return null;
  }

  const pinned = published.filter((a) => a.pinned);
  const rest = published.filter((a) => !a.pinned);
  const ordered = [...pinned, ...rest];
  const preview = ordered.slice(0, DASHBOARD_LIMIT);
  const hasMore = published.length > preview.length;

  return (
    <Reveal>
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-slate-900">
              Okuldan duyurular
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {pinned.length > 0
                ? "Sabitlenen duyurular öne çıkarıldı."
                : "Üniversitenin resmi duyuruları."}
            </p>
          </div>
          <Link
            to="/duyurular"
            className="text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Tümünü gör
          </Link>
        </div>

        <div className="space-y-3">
          {preview.map((item) => {
            const isPinned = item.pinned;
            const editedLabel = formatEditedAtLabel(item.editedAt);
            return (
              <Link
                key={item.id}
                to={`/duyurular/${item.id}`}
                className={`card-hover block p-5 transition-all ${
                  isPinned ? "border-amber-200/80 bg-amber-50/40 ring-1 ring-amber-100" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`icon-tile shrink-0 ${isPinned ? "bg-amber-100" : ""}`}
                    aria-hidden
                  >
                    <Icon
                      name={isPinned ? "pin" : "announcement"}
                      size={20}
                      className={isPinned ? "text-amber-700" : "text-brand-600"}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display font-bold text-slate-900">{item.title}</h3>
                      {isPinned && (
                        <span className="chip bg-amber-100 text-[10px] text-amber-800">Sabit</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {previewText(item.content)}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold text-slate-400">
                      {item.publishedAt ? formatDate(item.publishedAt) : formatDate(item.createdAt)}
                      {editedLabel && <span> · {editedLabel}</span>}
                    </p>
                  </div>
                  <Icon name="chevronRight" size={18} className="mt-1 shrink-0 text-slate-300" />
                </div>
              </Link>
            );
          })}
        </div>

        {hasMore && (
          <Link to="/duyurular" className="btn-secondary inline-flex text-sm">
            {published.length - preview.length} duyuru daha
          </Link>
        )}
      </section>
    </Reveal>
  );
}
