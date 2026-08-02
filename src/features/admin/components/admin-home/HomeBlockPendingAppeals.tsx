import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { isForbiddenAdminError } from "@/features/admin/adminQueryErrors";
import { getClubApplication, getClubApplications } from "@/features/admin/api/applications";
import { useAdminHomeBlockVisibility } from "@/features/admin/components/admin-home/AdminHomeBlocksContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Icon } from "@/shared/ui/Icon";

interface Props {
  universityId: string;
}

export default function HomeBlockPendingAppeals({ universityId }: Props) {
  const { hasPermission } = useAuth();
  const canReview = hasPermission("application.view");

  const query = useQuery({
    queryKey: ["admin", universityId, "club-applications", "pending-appeals"],
    queryFn: async () => {
      const rejected = await getClubApplications(universityId, "rejected");
      if (rejected.length === 0) return [];

      const details = await Promise.all(
        rejected.map((application) => getClubApplication(universityId, application.id)),
      );
      return details.filter((application) => application.appeal?.status === "pending");
    },
    enabled: canReview,
    retry: false,
  });

  const forbidden = query.isError && isForbiddenAdminError(query.error);
  const count = query.data?.length ?? 0;
  const visible = canReview && !forbidden && !query.isLoading && count > 0;

  useAdminHomeBlockVisibility(
    "pending-appeals",
    !canReview || forbidden ? "hidden" : query.isLoading ? "loading" : visible ? "visible" : "hidden",
  );

  if (!visible) return null;

  const firstId = query.data![0]!.id;

  return (
    <Link
      to={`/admin/applications/${firstId}`}
      className="card card-hover flex items-center gap-4 p-5"
    >
      <span className="icon-tile">
        <Icon name="pending" size={24} className="text-amber-600" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-bold text-slate-900">Bekleyen itirazlar</p>
        <p className="text-2xl font-extrabold text-amber-600">{count}</p>
      </div>
      <Icon name="chevronRight" size={16} className="shrink-0 text-slate-300" />
    </Link>
  );
}
