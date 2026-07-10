import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/api/notifications";
import { useAuth } from "@/features/auth/hooks/useAuth";

/**
 * Bildirim sorgu anahtarları. Sunucu tek doğru kaynak: WebSocket'ten bir olay
 * geldiğinde listeyi elle güncellemek yerine bu anahtarları invalidate ederiz
 * (NotificationsContext). Böylece optimistic state ile sunucu arasında ayrışma
 * olmaz — zil sayısı asla "hayalet" göstermez.
 */
export const notificationKeys = {
  all: ["notifications"] as const,
  list: ["notifications", "list"] as const,
  unreadCount: ["notifications", "unread-count"] as const,
};

const PAGE_SIZE = 20;

/** Zil rozeti. Oturum yoksa istek atılmaz. */
export function useUnreadCount() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: getUnreadCount,
    enabled: isAuthenticated,
    retry: false,
  });
}

/**
 * Sonsuz kaydırma — OFFSET değil cursor ile. `enabled` ile panel açılana kadar
 * istek atılmaz; zilin kendisi yalnızca okunmamış sayısını çeker.
 */
export function useNotificationList(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list,
    queryFn: ({ pageParam }) => listNotifications({ limit: PAGE_SIZE, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
    retry: false,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
