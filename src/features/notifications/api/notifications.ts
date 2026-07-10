// Bildirimler — /api/notifications (docs/FRONTEND_BILDIRIM_VE_LIMITLER.md §4).
import { apiClient } from "@/shared/api/client";
import type { AppNotification, NotificationPage, WsTicket } from "@/shared/types";

/**
 * Dokümandaki örnekler gövdeyi bazen zarfsız (`res.data.items`) gösteriyor,
 * projenin geri kalanı ise `{ success, message, data }` zarfına dayanıyor.
 * Bildirim uçlarını iki şekle de dayanıklı okuyoruz: `data` varsa onu, yoksa
 * gövdenin kendisini alırız. Backend hangisine karar verirse versin çağıranlar
 * etkilenmez.
 */
const unwrap = <T>(body: unknown): T => {
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
};

/**
 * POST /notifications/ws-ticket — WebSocket için tek kullanımlık, 60 sn ömürlü bilet.
 *
 * JWT'yi `?token=` ile query string'e koymak onu access/proxy loglarına ve
 * tarayıcı geçmişine sızdırırdı; bunun yerine kısa ömürlü bilet kullanılıyor.
 * Her (yeniden) bağlanmada YENİSİ alınmalı — bilet ikinci kullanımda 4401 verir.
 */
export const createWsTicket = async (): Promise<WsTicket> => {
  const response = await apiClient.post("/notifications/ws-ticket");
  return unwrap<WsTicket>(response.data);
};

/** GET /notifications — keyset sayfalama; `cursor` bir önceki sayfanın `nextCursor`'ı. */
export const listNotifications = async (params: {
  limit?: number;
  cursor?: string;
}): Promise<NotificationPage> => {
  const response = await apiClient.get("/notifications", {
    params: { limit: params.limit ?? 20, cursor: params.cursor },
  });
  return unwrap<NotificationPage>(response.data);
};

/** GET /notifications/unread-count — zil rozeti. */
export const getUnreadCount = async (): Promise<number> => {
  const response = await apiClient.get("/notifications/unread-count");
  return unwrap<{ count: number }>(response.data).count;
};

/** PATCH /notifications/:id/read — başkasının bildirimi 404 döner (IDOR koruması). */
export const markNotificationRead = async (id: string): Promise<AppNotification> => {
  const response = await apiClient.patch(`/notifications/${id}/read`);
  return unwrap<AppNotification>(response.data);
};

/** PATCH /notifications/read-all — okunmuşa çevrilen satır sayısını döner. */
export const markAllNotificationsRead = async (): Promise<number> => {
  const response = await apiClient.patch("/notifications/read-all");
  return unwrap<{ updated: number }>(response.data).updated;
};
