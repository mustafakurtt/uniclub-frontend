import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { createNotificationSocket } from "@/features/notifications/socket";
import { notificationKeys } from "@/features/notifications/queries";
import type { AppNotification } from "@/shared/types";

/**
 * Gerçek zamanlı bildirim kanalı (docs/FRONTEND_BILDIRIM_VE_LIMITLER.md).
 *
 * Oturum boyunca TEK bir WebSocket açar ve gelen olayları TanStack Query
 * invalidation'larına çevirir. Yani soket "veri" taşımaz, "veri bayatladı"
 * sinyali taşır — liste ve rozet her zaman REST'ten okunur, hayalet sayaç olmaz.
 *
 * En önemli iş `account.verified`: kullanıcı doğrulama mailini genelde BAŞKA bir
 * sekmede açar, bu sekmenin haberi olmaz. Backend olayı bağlı tüm cihazlara
 * push'lar; burada `me` + `me/permissions` yenilenir ve pending banner'ı kalkar.
 */
interface NotificationsContextValue {
  /** WebSocket açık mı — "çevrimdışı" göstergesi için. */
  connected: boolean;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token, logout } = useAuth();
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  // Soketi her render'da değil, yalnızca oturum değiştiğinde kur. logout ve
  // queryClient referansları zaten sabit; ref sadece niyeti açık tutuyor.
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  useEffect(() => {
    if (!token) {
      setConnected(false);
      return;
    }

    const invalidate = (queryKey: readonly unknown[]) =>
      queryClient.invalidateQueries({ queryKey });

    const applyEffect = (notification: AppNotification) => {
      switch (notification.type) {
        case "account.suspended":
          // Sonraki HTTP isteği zaten 403 alacak; beklemeden kapatıyoruz.
          logoutRef.current();
          return;

        case "account.verified":
        case "role.assigned":
          // status ve permissions RBAC cache'inden gelir — ikisini de tazele.
          invalidate(["auth", "me"]);
          invalidate(["auth", "permissions"]);
          break;

        case "club.membership.decided":
          invalidate(["auth", "clubMemberships"]);
          invalidate(["clubs"]);
          break;

        case "club.application.decided":
          invalidate(["clubs"]);
          break;

        default:
          break; // tanımadığımız tip: yine de listeye düşsün
      }

      invalidate(notificationKeys.all);
    };

    const socket = createNotificationSocket({
      onNotification: applyEffect,
      onUnauthorized: () => logoutRef.current(),
      onStatusChange: setConnected,
    });

    return () => socket.close();
  }, [token, queryClient]);

  return (
    <NotificationsContext.Provider value={{ connected }}>{children}</NotificationsContext.Provider>
  );
}

export function useNotificationsChannel(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotificationsChannel, NotificationsProvider içinde kullanılmalıdır.");
  }
  return ctx;
}
