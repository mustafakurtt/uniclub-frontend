import type { FeedCommentPreview, FeedItem } from "@/shared/types";

export interface VisualFeedCard {
  key: string;
  type: "activity" | "gallery";
  href: string;
  title: string;
  clubName: string;
  clubLogoUrl: string | null;
  at: string;
  imageUrl: string | null;
  commentCount?: number;
  likeCount?: number;
  recentComments?: FeedCommentPreview[];
}

function readSocialFields(item: FeedItem["item"]) {
  const commentCount =
    typeof item.commentCount === "number" ? item.commentCount : undefined;
  const likeCount = typeof item.likeCount === "number" ? item.likeCount : undefined;
  const recentComments =
    item.recentComments && item.recentComments.length > 0
      ? item.recentComments
      : undefined;

  return { commentCount, likeCount, recentComments };
}

/**
 * Dashboard görsel akışı — metin duyuruları hariç; yalnızca etkinlik + galeri.
 * Görsel URL yoksa yer tutucu ile kart yine oluşturulur.
 */
export function toVisualFeedCards(items: FeedItem[]): VisualFeedCard[] {
  const cards: VisualFeedCard[] = [];

  for (const row of items) {
    if (row.type === "announcement" || row.type === "university_announcement") {
      continue;
    }

    const clubName = row.club?.name ?? "Kulüp";
    const social = readSocialFields(row.item);

    if (row.type === "activity") {
      cards.push({
        key: `activity-${row.id}`,
        type: "activity",
        href: `/activities/${row.item.id}`,
        title: row.item.title?.trim() || "Etkinlik",
        clubName,
        clubLogoUrl: row.club?.logoUrl ?? null,
        at: row.at,
        imageUrl: row.item.coverUrl?.trim() || null,
        ...social,
      });
      continue;
    }

    if (row.type === "gallery") {
      const caption = row.item.caption?.trim();
      cards.push({
        key: `gallery-${row.id}`,
        type: "gallery",
        href: row.club ? `/clubs/${row.club.id}` : "/clubs",
        title: caption || "Galeri",
        clubName,
        clubLogoUrl: row.club?.logoUrl ?? null,
        at: row.at,
        imageUrl: row.item.imageUrl?.trim() || null,
        ...social,
      });
    }
  }

  return cards;
}

export function formatFeedCardDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}
