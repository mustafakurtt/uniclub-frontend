import type { IconName } from "@/shared/ui/Icon";
import type { AppNotification } from "@/shared/types";

/**
 * Bildirim tipinden ikon ve derin link (docs/FRONTEND_BILDIRIM_VE_LIMITLER.md §4).
 *
 * Tip listesi KAPALI DEĞİL: backend yarın yeni bir `type` eklerse zil çökmemeli.
 * Bu yüzden her iki fonksiyon da tanımadığı tipte güvenli bir varsayılana düşer
 * (jenerik zil ikonu / linksiz), bildirim yine `title` + `body` ile görünür.
 */
const ICON_BY_TYPE: Record<string, IconName> = {
  "account.verified": "check",
  "account.suspended": "lock",
  "club.application.decided": "club",
  "club.application.revision_requested": "edit",
  "club.application.committee_pending": "pending",
  "club.formation.threshold_reached": "party",
  "club.membership.decided": "members",
  "role.assigned": "role",
};

export const notificationIcon = (type: string): IconName => ICON_BY_TYPE[type] ?? "bell";

/** Zil satırında gösterilecek başlık — backend metni yoksa tipe göre yedek. */
export function notificationDisplayTitle(notification: AppNotification): string {
  if (notification.title.trim()) return notification.title;
  if (notification.type === "club.application.committee_pending") {
    const proposedName = readString(notification.data, "proposedName");
    return proposedName
      ? `${proposedName} — kurul oylamanız bekleniyor`
      : "Kurul oylamanız bekleniyor";
  }
  return "Bildirim";
}

/** Zil satırı gövdesi — kurul bekleyeninde bağlam ekle. */
export function notificationDisplayBody(notification: AppNotification): string | null {
  if (notification.body) return notification.body;
  if (notification.type === "club.application.committee_pending") {
    const committeeName = readString(notification.data, "committeeName");
    return committeeName
      ? `${committeeName} bu başvuruda oy kullanmanızı bekliyor.`
      : "Başvuru detayından oyunuzu kullanabilirsiniz.";
  }
  return null;
}

/** `data` serbest yük olduğu için her alanı okumadan önce tipini doğrularız. */
const readString = (data: Record<string, unknown> | null, key: string): string | null => {
  const value = data?.[key];
  return typeof value === "string" ? value : null;
};

/**
 * Tıklanınca gidilecek rota; null = link yok (bildirim yalnızca okundu işaretlenir).
 *
 * Kulüp KURMA başvurusunun reddi için bir detay sayfamız yok — onaylandıysa yeni
 * kulübe götürür, reddedildiyse mesajın kendisi zaten gerekçeyi taşır.
 */
export function notificationLink(notification: AppNotification): string | null {
  const { data } = notification;

  switch (notification.type) {
    case "club.application.decided": {
      const clubId = readString(data, "clubId");
      return readString(data, "status") === "approved" && clubId ? `/clubs/${clubId}` : null;
    }
    case "club.application.revision_requested": {
      const applicationId = readString(data, "applicationId");
      return applicationId ? `/applications/${applicationId}` : null;
    }
    case "club.application.committee_pending": {
      const applicationId = readString(data, "applicationId");
      return applicationId ? `/admin/applications/${applicationId}` : null;
    }
    case "club.formation.threshold_reached": {
      const applicationId = readString(data, "applicationId");
      if (applicationId) return `/applications/${applicationId}`;
      const proposalId = readString(data, "proposalId");
      return proposalId ? `/clubs/proposals/${proposalId}` : null;
    }
    case "club.membership.decided": {
      const clubId = readString(data, "clubId");
      return clubId ? `/clubs/${clubId}` : null;
    }
    default:
      // account.verified / role.assigned → etkisi anında uygulanır (banner kalkar,
      // menüler açılır); gidilecek ayrı bir sayfa yok.
      return null;
  }
}

/** "az önce" / "12 dk" / "3 sa" / "5 g" — panelde kısa göreli zaman. */
export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dk`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} g`;

  return new Date(isoDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}
