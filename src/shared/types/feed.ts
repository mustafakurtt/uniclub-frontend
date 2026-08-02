// Kampüs akışı — GET /api/feed
//
// Backend kaynakları birleştirir; imleç opak (at + kind + id). Öğe gövdesi
// kaynağa göre değişir — ayrım `type` alanından yapılır.

/** Akıştaki öğenin kaynağı. `gallery` backend bu turda ekleniyor. */
export type FeedItemType =
  | "university_announcement"
  | "announcement"
  | "activity"
  | "gallery";

/** Akış satırında görünen kompakt kulüp (okul geneli duyuruda null). */
export interface FeedClub {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

/** Sosyal katman önizlemesi — salt okunur; yazma ucu yok (T2.7). */
export interface FeedCommentPreview {
  id: string;
  body: string;
  authorName?: string | null;
}

/** Kaynağa göre değişen gövdeden akışın ihtiyaç duyduğu alanlar. */
export interface FeedEntity {
  id: string;
  title?: string;
  content?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  location?: string | null;
  publishedAt?: string | null;
  createdAt?: string;
  coverUrl?: string | null;
  imageUrl?: string;
  caption?: string | null;
  /** Bayrak kapalı tenant'ta gelmez — kart sosyal bölümü gizlenir. */
  commentCount?: number;
  likeCount?: number;
  recentComments?: FeedCommentPreview[];
}

export interface FeedItem {
  type: FeedItemType;
  /** Sıralama zamanı — duyuruda yayın, etkinlikte oluşturulma anı. */
  at: string;
  id: string;
  club: FeedClub | null;
  item: FeedEntity;
}

export interface FeedPage {
  items: FeedItem[];
  nextCursor: string | null;
}
