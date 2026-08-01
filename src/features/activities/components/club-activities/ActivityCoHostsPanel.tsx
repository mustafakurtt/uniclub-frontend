import { useState } from "react";
import SelectField from "@/shared/ui/SelectField";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getActivityCoHosts,
  inviteActivityCoHost,
  removeActivityCoHost,
} from "@/features/activities/api/clubActivities";
import { getAvailableClubs } from "@/features/clubs/api/clubs";
import { getErrorMessage } from "@/shared/api/client";
import { invalidateActivityQueries } from "@/features/activities/invalidateActivities";
import { Icon } from "@/shared/ui/Icon";
import IconButton from "@/shared/ui/IconButton";

interface ActivityCoHostsPanelProps {
  hostClubId: string;
  activityId: string;
}

export default function ActivityCoHostsPanel({ hostClubId, activityId }: ActivityCoHostsPanelProps) {
  const queryClient = useQueryClient();
  const [targetClubId, setTargetClubId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const coHostsQuery = useQuery({
    queryKey: ["clubs", hostClubId, "activities", activityId, "co-hosts"],
    queryFn: () => getActivityCoHosts(hostClubId, activityId),
  });

  const clubsQuery = useQuery({
    queryKey: ["clubs"],
    queryFn: () => getAvailableClubs(),
  });

  const invalidate = () => invalidateActivityQueries(queryClient, hostClubId, activityId);

  const inviteMutation = useMutation({
    mutationFn: () => inviteActivityCoHost(hostClubId, activityId, targetClubId),
    onSuccess: () => {
      setTargetClubId("");
      setError(null);
      invalidate();
      coHostsQuery.refetch();
    },
    onError: (err) => setError(getErrorMessage(err, "Davet gönderilemedi.")),
  });

  const removeMutation = useMutation({
    mutationFn: (coClubId: string) => removeActivityCoHost(hostClubId, activityId, coClubId),
    onSuccess: () => {
      invalidate();
      coHostsQuery.refetch();
    },
  });

  const coHosts = coHostsQuery.data ?? [];
  const clubOptions = (clubsQuery.data ?? []).filter(
    (c) => c.id !== hostClubId && !coHosts.some((ch) => ch.clubId === c.id)
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Co-host kulüpler farklı üniversitelerden olabilir. Davet kabul edilene kadar listede görünmez.
      </p>

      <div className="flex flex-wrap gap-2">
        <SelectField
          value={targetClubId}
          onChange={(e) => setTargetClubId(e.target.value)}
          className="input-field min-w-[12rem] flex-1"
          aria-label="Davet edilecek kulüp"
        >
          <option value="">Kulüp seç...</option>
          {clubOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <button
          type="button"
          className="btn-secondary text-xs"
          disabled={!targetClubId || inviteMutation.isPending}
          onClick={() => inviteMutation.mutate()}
        >
          Davet Gönder
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {coHostsQuery.isLoading ? (
        <div className="skeleton h-10 w-full" />
      ) : coHosts.length === 0 ? (
        <p className="text-sm text-slate-400">Henüz co-host yok.</p>
      ) : (
        <ul className="space-y-2">
          {coHosts.map((row) => (
            <li
              key={row.clubId}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Icon name="handshake" size={14} className="text-brand-600" />
                <span className="text-sm font-semibold text-slate-800">{row.club.name}</span>
                <span
                  className={`chip text-[10px] ${
                    row.status === "accepted" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {row.status === "accepted" ? "Kabul edildi" : "Davet bekliyor"}
                </span>
              </div>
              <IconButton
                icon="delete"
                label="Co-host kaldır"
                tone="danger"
                disabled={removeMutation.isPending}
                onClick={() => removeMutation.mutate(row.clubId)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
