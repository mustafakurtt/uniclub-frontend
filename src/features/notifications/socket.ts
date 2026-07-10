import { API_BASE_URL } from "@/shared/api/client";
import { createWsTicket } from "@/features/notifications/api/notifications";
import type { AppNotification } from "@/shared/types";

/**
 * Bildirim WebSocket'i (docs/FRONTEND_BILDIRIM_VE_LIMITLER.md §4, BILDIRIMLER.md).
 * React'ten bağımsız, tek sorumluluğu olan bir bağlantı yöneticisi: bilet al →
 * bağlan → mesajları ilet → koptuysa geri çekilerek (backoff) yeniden dene.
 *
 * Üç kural doğrudan buradan gelir:
 *   1. `{"event":"ping"}` → düz metin `"pong"` yanıtı. Yoksa sunucu 90 sn'de koparır.
 *   2. `onclose` → exponential backoff + JITTER. Jitter şart: sunucu yeniden
 *      başladığında tüm istemciler saniyesi saniyesine aynı anda vurursa
 *      (thundering herd) sunucuyu tekrar düşürürler.
 *   3. close code 4401 = yetkisiz → yeniden DENEME; oturumu kapat.
 */
const RECONNECT_CAP_MS = 30_000;
const UNAUTHORIZED_CLOSE_CODE = 4401;

interface SocketHandlers {
  onNotification: (notification: AppNotification) => void;
  /** 4401 — bilet/oturum geçersiz. Yeniden bağlanmayız; kullanıcı login'e gider. */
  onUnauthorized: () => void;
  onStatusChange?: (connected: boolean) => void;
}

/**
 * REST temel adresini WebSocket temel adresine çevirir. Adres tek kaynaktan
 * (`API_BASE_URL`) türetilir ve iki biçim de desteklenir:
 *
 *   • Mutlak (dev):  `http(s)://host/api` → `ws(s)://host/api`
 *   • Göreli (prod tek-origin):  `/api` → `wss://<sayfa-host>/api`
 *
 * Prod'da imaj `VITE_API_BASE_URL=/api` ile derlenir (frontend kökte, backend
 * `/api` altında; bkz. deploy/Caddyfile). Göreli adreste `replace(/^http/…)`
 * hiçbir şey yapmaz; o yüzden şemayı ve host'u sayfanın konumundan alırız.
 * `new WebSocket("/api/…")` çoğu modern tarayıcıda çalışsa da davranış
 * spec'e yeni girmiştir — mutlak adres üretmek her yerde güvenlidir.
 */
const wsBaseUrl = (): string => {
  if (/^https?:\/\//i.test(API_BASE_URL)) {
    return API_BASE_URL.replace(/^http/i, "ws");
  }
  const scheme = window.location.protocol === "https:" ? "wss:" : "ws:";
  const path = API_BASE_URL.startsWith("/") ? API_BASE_URL : `/${API_BASE_URL}`;
  return `${scheme}//${window.location.host}${path}`;
};

const socketUrl = (ticket: string): string =>
  `${wsBaseUrl()}/notifications/ws?ticket=${encodeURIComponent(ticket)}`;

/**
 * Gelen mesaj şekli iki biçimde olabilir: bildirim ya doğrudan gövdedir
 * (`{ id, type, … }`) ya da bir zarfın içindedir (`{ event: "notification", data }`).
 * İkisini de kabul ediyoruz; tanımadığımız her şeyi sessizce yok sayıyoruz —
 * bilinmeyen bir `event` yüzünden zil çökmemeli (§4: "tanımadığın type'ta çökme").
 */
const parseNotification = (message: Record<string, unknown>): AppNotification | null => {
  const candidate =
    message.event === "notification" && message.data && typeof message.data === "object"
      ? (message.data as Record<string, unknown>)
      : message;

  return typeof candidate.type === "string" && typeof candidate.id === "string"
    ? (candidate as unknown as AppNotification)
    : null;
};

export function createNotificationSocket(handlers: SocketHandlers) {
  let socket: WebSocket | null = null;
  let reconnectTimer: number | undefined;
  let attempt = 0;
  let closed = false; // close() çağrıldı → hiçbir koşulda yeniden bağlanma

  /** Full jitter: [0, min(cap, 2^attempt * 1sn)) aralığından rastgele bekle. */
  const nextDelayMs = (): number => {
    const ceiling = Math.min(RECONNECT_CAP_MS, 1000 * 2 ** attempt);
    return Math.random() * ceiling;
  };

  const scheduleReconnect = () => {
    if (closed) return;
    reconnectTimer = window.setTimeout(connect, nextDelayMs());
    attempt += 1;
  };

  const handleMessage = (ws: WebSocket, raw: unknown) => {
    if (typeof raw !== "string") return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return; // düz metin çerçeveler (ör. "pong") — bizi ilgilendirmiyor
    }
    if (!parsed || typeof parsed !== "object") return;

    const message = parsed as Record<string, unknown>;
    if (message.event === "ping") {
      ws.send("pong"); // JSON değil, düz metin
      return;
    }

    const notification = parseNotification(message);
    if (notification) handlers.onNotification(notification);
  };

  async function connect() {
    if (closed) return;

    let ticket: string;
    try {
      ({ ticket } = await createWsTicket());
    } catch {
      // Ağ/5xx → tekrar dene. 401 ise interceptor zaten oturumu kapatmıştır ve
      // provider bu soketi close() eder; aşağıdaki `closed` kontrolü onu yakalar.
      scheduleReconnect();
      return;
    }
    if (closed) return;

    const ws = new WebSocket(socketUrl(ticket));
    socket = ws;

    ws.onopen = () => {
      attempt = 0; // başarılı bağlantı backoff'u sıfırlar
      handlers.onStatusChange?.(true);
    };
    ws.onmessage = (event) => handleMessage(ws, event.data);
    ws.onerror = () => ws.close(); // hata her zaman close'u da tetiklesin
    ws.onclose = (event) => {
      handlers.onStatusChange?.(false);
      if (closed) return;
      if (event.code === UNAUTHORIZED_CLOSE_CODE) {
        handlers.onUnauthorized();
        return;
      }
      scheduleReconnect();
    };
  }

  void connect();

  return {
    close() {
      closed = true;
      window.clearTimeout(reconnectTimer);
      socket?.close(1000, "client closed");
      socket = null;
    },
  };
}
