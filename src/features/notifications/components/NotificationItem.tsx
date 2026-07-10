import { Icon } from "@/shared/ui/Icon";
import { formatRelativeTime, notificationIcon, notificationLink } from "@/features/notifications/labels";
import type { AppNotification } from "@/shared/types";

/**
 * Tek bildirim satırı. Linki olmayan tipler de tıklanabilir kalır — tıklama
 * "okundu işaretle" anlamına gelir, yalnızca hedefe gitmez.
 */
export default function NotificationItem({
  notification,
  onSelect,
}: {
  notification: AppNotification;
  onSelect: (notification: AppNotification) => void;
}) {
  const isUnread = notification.readAt === null;
  const hasLink = notificationLink(notification) !== null;

  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-50/70 ${
        isUnread ? "bg-brand-50/40" : ""
      }`}
    >
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          isUnread ? "bg-brand-100 text-brand-600" : "bg-slate-100 text-slate-400"
        }`}
      >
        <Icon name={notificationIcon(notification.type)} size={17} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span
            className={`truncate text-sm ${
              isUnread ? "font-bold text-slate-900" : "font-semibold text-slate-600"
            }`}
          >
            {notification.title}
          </span>
          <span className="shrink-0 text-[11px] font-medium text-slate-400">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </span>

        {notification.body && (
          <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-slate-500">
            {notification.body}
          </span>
        )}

        {hasLink && (
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600">
            Görüntüle <Icon name="chevronRight" size={12} />
          </span>
        )}
      </span>

      {isUnread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-label="Okunmadı" />}
    </button>
  );
}
