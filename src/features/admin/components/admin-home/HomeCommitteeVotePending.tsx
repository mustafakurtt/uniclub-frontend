import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listNotifications } from "@/features/notifications/api/notifications";
import { deriveCommitteeVotePendingItems } from "@/features/notifications/committeePending";
import { notificationKeys } from "@/features/notifications/queries";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Icon } from "@/shared/ui/Icon";

/**
 * Kurul üyesine oy bekleyen başvurular — GET /notifications akışından türetilir;
 * ayrı "bana oy bekleyen" ucu yok.
 */
export default function HomeCommitteeVotePending() {
  const { isAuthenticated } = useAuth();

  const notificationsQuery = useQuery({
    queryKey: [...notificationKeys.list, "committee-pending-scan"],
    queryFn: async () => {
      const page = await listNotifications({ limit: 50 });
      return page.items;
    },
    enabled: isAuthenticated,
    retry: false,
  });

  const pendingItems = deriveCommitteeVotePendingItems(notificationsQuery.data ?? []);

  if (notificationsQuery.isLoading || pendingItems.length === 0) {
    return null;
  }

  return (
    <section className="card border-violet-100 bg-violet-50/40 p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="icon-tile shrink-0">
          <Icon name="pending" size={22} className="text-violet-600" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Oyunuzu bekleyen başvurular
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Kurul kademesindeki başvurularda salt çoğunluk için oyunuz gerekiyor.
          </p>
        </div>
      </div>

      <ul className="divide-y divide-violet-100 rounded-2xl border border-violet-100 bg-white">
        {pendingItems.map((item) => (
          <li key={item.applicationId}>
            <Link
              to={`/admin/applications/${item.applicationId}`}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-violet-50/60"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                {item.body && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{item.body}</p>
                )}
              </div>
              <Icon name="chevronRight" size={16} className="shrink-0 text-slate-300" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
