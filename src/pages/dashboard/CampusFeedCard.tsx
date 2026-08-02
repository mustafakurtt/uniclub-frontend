import { useState } from "react";
import { Link } from "react-router-dom";
import { clubInitial, coverGradient } from "@/features/clubs/clubIdentity";
import { formatFeedCardDate, type VisualFeedCard } from "@/pages/dashboard/campusFeedVisual";
import { Icon } from "@/shared/ui/Icon";

function ClubLogoBadge({
  clubName,
  logoUrl,
}: {
  clubName: string;
  logoUrl: string | null;
}) {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/90 bg-white shadow-md"
      aria-hidden
    >
      {logoUrl ? (
        <img src={logoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span
          className={`flex h-full w-full items-center justify-center bg-gradient-to-br text-xs font-extrabold text-white ${coverGradient(clubName)}`}
        >
          {clubInitial(clubName)}
        </span>
      )}
    </div>
  );
}

function FeedCardImage({
  card,
}: {
  card: VisualFeedCard;
}) {
  const [loaded, setLoaded] = useState(!card.imageUrl);
  const typeLabel = card.type === "gallery" ? "Galeri" : "Etkinlik";
  const dateLabel = formatFeedCardDate(card.at);

  return (
    <div className="relative aspect-[16/9] shrink-0 overflow-hidden bg-slate-100">
      {!card.imageUrl ? (
        <div
          aria-hidden
          className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${coverGradient(card.clubName)}`}
        >
          <span className="font-display text-4xl font-extrabold text-white/85">
            {clubInitial(card.clubName)}
          </span>
        </div>
      ) : (
        <>
          {!loaded && <div className="absolute inset-0 animate-pulse bg-slate-200" />}
          <img
            src={card.imageUrl}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        </>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
        <span className="rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          {typeLabel}
        </span>
        <span className="rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-800 shadow-sm backdrop-blur-sm">
          {dateLabel}
        </span>
      </div>

      <div className="pointer-events-none absolute bottom-2.5 left-2.5">
        <ClubLogoBadge clubName={card.clubName} logoUrl={card.clubLogoUrl} />
      </div>
    </div>
  );
}

function FeedSocialSection({ card }: { card: VisualFeedCard }) {
  const hasCounts =
    typeof card.commentCount === "number" || typeof card.likeCount === "number";
  const previews = card.recentComments?.slice(0, 3) ?? [];

  if (!hasCounts && previews.length === 0) {
    return null;
  }

  return (
    <div className="mt-auto border-t border-slate-100 pt-3">
      {hasCounts && (
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
          {typeof card.likeCount === "number" && (
            <span className="inline-flex items-center gap-1" aria-label={`${card.likeCount} beğeni`}>
              <Icon name="star" size={14} className="text-amber-500" />
              {card.likeCount}
            </span>
          )}
          {typeof card.commentCount === "number" && (
            <span
              className="inline-flex items-center gap-1"
              aria-label={`${card.commentCount} yorum`}
            >
              <Icon name="comment" size={14} className="text-slate-400" />
              {card.commentCount}
            </span>
          )}
        </div>
      )}
      {previews.length > 0 && (
        <ul className="mt-2 space-y-1">
          {previews.map((comment) => (
            <li key={comment.id} className="line-clamp-1 text-xs text-slate-500">
              {comment.authorName && (
                <span className="font-semibold text-slate-600">{comment.authorName}: </span>
              )}
              {comment.body}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CampusFeedCard({ card }: { card: VisualFeedCard }) {
  return (
    <article
      className="card flex h-full w-[min(78vw,20rem)] shrink-0 snap-start flex-col overflow-hidden p-0 sm:w-80"
      aria-label={`${card.title} — ${card.clubName}`}
    >
      <Link to={card.href} className="group flex h-full min-h-[17.5rem] flex-col">
        <FeedCardImage card={card} />
        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 min-h-[2.75rem] font-display text-base font-bold leading-snug text-slate-900 group-hover:text-brand-700">
            {card.title}
          </h3>
          <p className="mt-1.5 truncate text-sm font-medium text-slate-500">{card.clubName}</p>
          <FeedSocialSection card={card} />
        </div>
      </Link>
    </article>
  );
}
