import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listNotifications } from "@/features/notifications/api/notifications";
import {
  acceptActivityCoHostInvite,
  declineActivityCoHostInvite,
} from "@/features/activities/api/clubActivities";
import { getErrorMessage } from "@/shared/api/client";
import { invalidateActivityQueries } from "@/features/activities/invalidateActivities";
import { Icon } from "@/shared/ui/Icon";

interface ClubCoHostInvitesPanelProps {
  clubId: string;
}

/** Gelen co-host davetleri — backend'de ayrı liste ucu yok; bildirimlerden okunur. */
export default function ClubCoHostInvitesPanel({ clubId }: ClubCoHostInvitesPanelProps) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const notificationsQuery = useQuery({
    queryKey: ["notifications", "list", { limit: 50 }],
    queryFn: () => listNotifications({ limit: 50 }),
  });

  const invites =
    notificationsQuery.data?.items.filter((n) => {
      if (n.type !== "activity.coHostInvited") return false;
      const data = n.data;
      return data && typeof data.clubId === "string" && data.clubId === clubId;
    }) ?? [];

  const invalidate = (activityId: string) => invalidateActivityQueries(queryClient, clubId, activityId);

  const acceptMutation = useMutation({
    mutationFn: (activityId: string) => acceptActivityCoHostInvite(clubId, activityId),
    onSuccess: (_, activityId) => {
      setActionError(null);
      invalidate(activityId);
      notificationsQuery.refetch();
    },
    onError: (err) => setActionError(getErrorMessage(err, "Davet kabul edilemedi.")),
  });

  const declineMutation = useMutation({
    mutationFn: (activityId: string) => declineActivityCoHostInvite(clubId, activityId),
    onSuccess: (_, activityId) => {
      setActionError(null);
      invalidate(activityId);
      notificationsQuery.refetch();
    },
    onError: (err) => setActionError(getErrorMessage(err, "Davet reddedilemedi.")),
  });

  if (notificationsQuery.isLoading || invites.length === 0) {
    return null;
  }

  return (
    <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon name="handshake" size={18} className="text-amber-600" />
        <h3 className="font-display text-sm font-bold text-amber-900">Bekleyen co-host davetleri</h3>
      </div>
      {actionError && <div className="alert-error mb-3">{actionError}</div>}
      <ul className="space-y-2">
        {invites.map((n) => {
          const activityId = typeof n.data?.activityId === "string" ? n.data.activityId : null;
          if (!activityId) return null;
          return (
            <li
              key={n.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/80 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                {n.body && <p className="text-xs text-slate-500">{n.body}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-primary text-xs"
                  disabled={acceptMutation.isPending || declineMutation.isPending}
                  onClick={() => acceptMutation.mutate(activityId)}
                >
                  Kabul Et
                </button>
                <button
                  type="button"
                  className="btn-ghost text-xs text-red-600"
                  disabled={acceptMutation.isPending || declineMutation.isPending}
                  onClick={() => declineMutation.mutate(activityId)}
                >
                  Reddet
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
