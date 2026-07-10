import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { decideJoinRequest, getJoinRequests } from "@/features/clubs/api/clubs";
import { getErrorMessage } from "@/shared/api/client";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";

// Bekleyen üyelik istekleri (FRONTEND_CLUBS.md §7.1-7.2).
// Görüntüleme "staff" yetkisidir (danışman dahil); KARAR yalnızca officer/başkanın.
// Bu bileşen yalnızca staff kullanıcıya render edilmelidir (sayfa karar verir).

interface ClubJoinRequestsSectionProps {
  clubId: string;
  /** officer/başkan → true; danışman → false (yalnızca gözetim) */
  canDecide: boolean;
}

export default function ClubJoinRequestsSection({ clubId, canDecide }: ClubJoinRequestsSectionProps) {
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: ["clubs", clubId, "join-requests"],
    queryFn: () => getJoinRequests(clubId),
  });

  const decideMutation = useMutation({
    mutationFn: ({ userId, decision }: { userId: string; decision: "approved" | "rejected" }) =>
      decideJoinRequest(clubId, userId, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clubs", clubId] });
    },
  });

  const requests = requestsQuery.data ?? [];

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="icon-tile"><Icon name="pending" size={24} className="text-brand-600" /></span>
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Üyelik İstekleri</h2>
          <p className="text-xs text-slate-500">
            {canDecide ? "Onayla ya da reddet." : "Danışman olarak görüntülüyorsun — karar yönetime ait."}
          </p>
        </div>
      </div>

      {decideMutation.isError && (
        <div className="alert-error mb-4">
          {getErrorMessage(decideMutation.error, "İstek güncellenemedi.")}
        </div>
      )}

      {requestsQuery.isLoading ? (
        <div className="space-y-3">
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
        </div>
      ) : requestsQuery.isError ? (
        <div className="alert-error">
          {getErrorMessage(requestsQuery.error, "İstekler yüklenemedi.")}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState icon="check" title="Bekleyen istek yok" />
      ) : (
        <ul className="divide-y divide-slate-100">
          {requests.map((r) => (
            <li key={r.userId} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-600 to-accent-400 text-xs font-bold text-white">
                  {r.user.photoUrl ? (
                    <img src={r.user.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (r.user.firstName[0] ?? "?").toUpperCase()
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {r.user.firstName} {r.user.lastName}
                  </p>
                  <p className="truncate text-xs text-slate-400">{r.user.email}</p>
                </div>
              </div>
              {canDecide && (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    className="btn-secondary px-3 py-1.5 text-xs"
                    disabled={decideMutation.isPending}
                    onClick={() => decideMutation.mutate({ userId: r.userId, decision: "approved" })}
                  >
                    <Icon name="check" size={14} /> Onayla
                  </button>
                  <button
                    className="btn-ghost px-3 py-1.5 text-xs text-slate-400 hover:text-red-600"
                    disabled={decideMutation.isPending}
                    onClick={() => decideMutation.mutate({ userId: r.userId, decision: "rejected" })}
                  >
                    <Icon name="reject" size={14} /> Reddet
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
