// Kampüs akışı — GET /api/feed
//
// Backend üç kaynağı tek akışta birleştirir (okul geneli duyuru, kulüp duyurusu,
// etkinlik) ve (at, kind, id) üçlüsüyle imleçli sayfalar. Öğe gövdesi kaynağa
// göre değişir; ayrım `type` alanından yapılır.

/** Akıştaki öğenin kaynağı. */
export type FeedItemType = "university_announcement" | "announcement" | "activity";

/** Akış satırında görünen kompakt kulüp (okul geneli duyuruda null). */
export interface FeedClub {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
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
