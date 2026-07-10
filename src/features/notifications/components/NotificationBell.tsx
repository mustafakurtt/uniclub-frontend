import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/shared/ui/Icon";
import EmptyState from "@/shared/ui/EmptyState";
import NotificationItem from "@/features/notifications/components/NotificationItem";
import { notificationLink } from "@/features/notifications/labels";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationList,
  useUnreadCount,
} from "@/features/notifications/queries";
import { useNotificationsChannel } from "@/features/notifications/context/NotificationsContext";
import type { AppNotification } from "@/shared/types";

/**
 * Bildirim zili (docs/FRONTEND_BILDIRIM_VE_LIMITLER.md §4).
 *
 * Rozet için yalnızca `unread-count` çekilir; asıl liste panel AÇILDIĞINDA
 * yüklenir (`enabled`). Sayfalama cursor tabanlı, "Daha fazla" düğmesiyle.
 */
export default function NotificationBell({
  /** Panelin hangi kenardan açılacağı. Dar bir kabukta (admin sidebar'ı) sağa
      hizalanmış panel ekranın dışına taşar; orada "left" verilir. */
  align = "right",
}: {
  align?: "left" | "right";
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { connected } = useNotificationsChannel();
  const { data: unreadCount = 0 } = useUnreadCount();
  const listQuery = useNotificationList(open);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  // Dışarı tıklama + ESC ile kapan.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const notifications = listQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const handleSelect = (notification: AppNotification) => {
    if (notification.readAt === null) markRead.mutate(notification.id);
    const link = notificationLink(notification);
    setOpen(false);
    if (link) navigate(link);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="tap relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
        aria-label={unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : "Bildirimler"}
        aria-expanded={open}
      >
        <Icon name="bell" size={19} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-2 w-[min(22rem,calc(100vw-1.5rem))] animate-scale-in overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card ${
            align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="font-display text-sm font-bold text-slate-900">Bildirimler</p>
              {/* WS kopmuşsa liste bayat olabilir — sessizce yanıltmak yerine söyle. */}
              {!connected && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                  <Icon name="offline" size={11} /> çevrimdışı
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-xs font-semibold text-brand-600 transition-colors hover:text-brand-800 disabled:opacity-50"
              >
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {listQuery.isLoading ? (
              <div className="flex justify-center py-10">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon="bell"
                  title="Bildirim yok"
                  description="Kulüp başvurun ya da üyeliğin sonuçlandığında burada göreceksin."
                />
              </div>
            ) : (
              <>
                <ul className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <li key={notification.id}>
                      <NotificationItem notification={notification} onSelect={handleSelect} />
                    </li>
                  ))}
                </ul>

                {listQuery.hasNextPage && (
                  <button
                    type="button"
                    onClick={() => listQuery.fetchNextPage()}
                    disabled={listQuery.isFetchingNextPage}
                    className="w-full border-t border-slate-100 py-3 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50 disabled:opacity-50"
                  >
                    {listQuery.isFetchingNextPage ? "Yükleniyor..." : "Daha fazla göster"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
