// Bildirimler (docs/FRONTEND_BILDIRIM_VE_LIMITLER.md §4).
// Gerçek zamanlı kanal WebSocket, kalıcı liste REST — ikisi de AYNI şekli taşır.

/**
 * Backend'in bugün ürettiği tipler. Liste KAPALI DEĞİLDİR: `string & {}` sayesinde
 * bilinenlerde autocomplete alırız ama tanımadığımız bir `type` geldiğinde tip
 * hatası da, çalışma zamanı çökmesi de olmaz — jenerik ikonla gösterilir (§4).
 */
export type KnownNotificationType =
  | "account.verified"
  | "account.suspended"
  | "club.application.decided"
  | "club.application.committee_pending"
  | "club.membership.decided"
  | "role.assigned";

export type NotificationType = KnownNotificationType | (string & {});

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  /** Tipe göre değişen serbest yük — derin link buradan kurulur (notifications/labels.ts) */
  data: Record<string, unknown> | null;
  /** null = okunmamış */
  readAt: string | null;
  createdAt: string;
}

/**
 * Keyset (cursor) sayfalama — OFFSET değil. `nextCursor` null ise son sayfadayız;
 * değilse bir sonraki istek `?cursor=<nextCursor>` ile atılır.
 */
export interface NotificationPage {
  items: AppNotification[];
  nextCursor: string | null;
}

/** POST /notifications/ws-ticket — tek kullanımlık, 60 sn ömürlü. */
export interface WsTicket {
  ticket: string;
  expiresIn: number;
}
