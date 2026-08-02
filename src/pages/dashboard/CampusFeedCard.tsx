import { useState } from "react";
import { Link } from "react-router-dom";
import { clubInitial, coverGradient } from "@/features/clubs/clubIdentity";
import { formatFeedCardDate, type VisualFeedCard } from "@/pages/dashboard/campusFeedVisual";
import { Icon } from "@/shared/ui/Icon";

function FeedCardImage({
  imageUrl,
  clubName,
}: {
  imageUrl: string | null;
  clubName: string;
}) {
  const [loaded, setLoaded] = useState(!imageUrl);

  return (
    <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
      {!imageUrl ? (
        <div
          aria-hidden
          className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${coverGradient(clubName)}`}
        >
          <span className="font-display text-4xl font-extrabold text-white/85">
            {clubInitial(clubName)}
          </span>
        </div>
      ) : (
        <>
          {!loaded && <div className="absolute inset-0 animate-pulse bg-slate-200" />}
          <img
            src={imageUrl}
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
    <div className="mt-3 border-t border-slate-100 pt-3">
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
      className="card w-[min(85vw,18rem)] shrink-0 snap-start overflow-hidden p-0 sm:w-72"
      aria-label={`${card.title} — ${card.clubName}`}
    >
      <Link to={card.href} className="group block">
        <FeedCardImage imageUrl={card.imageUrl} clubName={card.clubName} />
        <div className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-brand-600">
            {card.type === "gallery" ? "Galeri" : "Etkinlik"}
          </p>
          <h3 className="mt-1 line-clamp-2 font-display text-base font-bold text-slate-900 group-hover:text-brand-700">
            {card.title}
          </h3>
          <p className="mt-1 truncate text-sm text-slate-500">
            {card.clubName} · {formatFeedCardDate(card.at)}
          </p>
          <FeedSocialSection card={card} />
        </div>
      </Link>
    </article>
  );
}
