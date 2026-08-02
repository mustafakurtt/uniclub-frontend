import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { isForbiddenAdminError } from "@/features/admin/adminQueryErrors";
import { getClubApplications } from "@/features/admin/api/applications";
import { useAdminHomeBlockVisibility } from "@/features/admin/components/admin-home/AdminHomeBlocksContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Icon } from "@/shared/ui/Icon";

interface Props {
  universityId: string;
}

export default function HomeBlockPendingApplications({ universityId }: Props) {
  const { hasPermission } = useAuth();
  const canView = hasPermission("application.view");

  const query = useQuery({
    queryKey: ["admin", universityId, "club-applications", "pending"],
    queryFn: () => getClubApplications(universityId, "pending"),
    enabled: canView,
    retry: false,
  });

  const forbidden = query.isError && isForbiddenAdminError(query.error);
  const count = query.data?.length ?? 0;
  const visible = canView && !forbidden && !query.isLoading && count > 0;

  useAdminHomeBlockVisibility(
    "pending-applications",
    !canView || forbidden ? "hidden" : query.isLoading ? "loading" : visible ? "visible" : "hidden",
  );

  if (!visible) return null;

  return (
    <Link to="/admin/clubs?tab=applications&status=pending" className="card card-hover flex items-center gap-4 p-5">
      <span className="icon-tile">
        <Icon name="inbox" size={24} className="text-brand-600" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-bold text-slate-900">Bekleyen başvurular</p>
        <p className="text-2xl font-extrabold text-brand-600">{count}</p>
      </div>
      <Icon name="chevronRight" size={16} className="shrink-0 text-slate-300" />
    </Link>
  );
}
