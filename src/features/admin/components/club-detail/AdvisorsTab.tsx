import { useQuery } from "@tanstack/react-query";
import { getClubAdvisors } from "@/features/admin/api/advisors";
import { getErrorMessage } from "@/shared/api/client";
import EmptyState from "@/shared/ui/EmptyState";

interface Props {
  universityId: string;
  clubId: string;
  enabled: boolean;
}

export default function AdvisorsTab({ universityId, clubId, enabled }: Props) {
  const advisorsQuery = useQuery({
    queryKey: ["admin", universityId, "clubs", clubId, "advisors"],
    queryFn: () => getClubAdvisors(universityId, clubId),
    enabled,
  });

  const advisors = advisorsQuery.data ?? [];

  if (advisorsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-14 w-full" />
      </div>
    );
  }

  if (advisorsQuery.isError) {
    return (
      <div className="alert-error">
        {getErrorMessage(advisorsQuery.error, "Danışmanlar yüklenemedi.")}
      </div>
    );
  }

  if (advisors.length === 0) {
    return <EmptyState icon="advisor" title="Bu kulüpte danışman yok" />;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {advisors.map((a) => (
        <li key={a.id} className="flex items-center gap-3 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-600 to-accent-400 text-xs font-bold text-white">
            {a.photoUrl ? (
              <img src={a.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (a.firstName[0] ?? "?").toUpperCase()
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {a.firstName} {a.lastName}
            </p>
            <p className="truncate text-xs text-slate-400">{a.email}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
