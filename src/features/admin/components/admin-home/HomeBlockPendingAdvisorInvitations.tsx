import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { isForbiddenAdminError } from "@/features/admin/adminQueryErrors";
import { getClubAdvisorInvitations } from "@/features/admin/api/advisors";
import { getAdminClubs } from "@/features/admin/api/clubs";
import { useAdminHomeBlockVisibility } from "@/features/admin/components/admin-home/AdminHomeBlocksContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Icon } from "@/shared/ui/Icon";
import type { ClubAdvisorInvitation } from "@/shared/types";

interface Props {
  universityId: string;
}

export default function HomeBlockPendingAdvisorInvitations({ universityId }: Props) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("club.advisor.manage");

  const query = useQuery({
    queryKey: ["admin", universityId, "advisor-invitations", "pending"],
    queryFn: async () => {
      const clubs = await getAdminClubs(universityId, "approved");
      const lists = await Promise.all(
        clubs.map((club) =>
          getClubAdvisorInvitations(universityId, club.id).catch(() => [] as ClubAdvisorInvitation[]),
        ),
      );
      return lists.flat().filter((invitation) => invitation.status === "pending");
    },
    enabled: canManage,
    retry: false,
  });

  const forbidden = query.isError && isForbiddenAdminError(query.error);
  const count = query.data?.length ?? 0;
  const visible = canManage && !forbidden && !query.isLoading && count > 0;

  useAdminHomeBlockVisibility(
    "pending-advisor-invitations",
    !canManage || forbidden ? "hidden" : query.isLoading ? "loading" : visible ? "visible" : "hidden",
  );

  if (!visible) return null;

  const firstClubId = query.data![0]!.club?.id;

  return (
    <Link
      to={firstClubId ? `/admin/clubs/${firstClubId}?tab=advisors` : "/admin/clubs"}
      className="card card-hover flex items-center gap-4 p-5"
    >
      <span className="icon-tile">
        <Icon name="advisor" size={24} className="text-violet-600" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-bold text-slate-900">Bekleyen danışman davetleri</p>
        <p className="text-2xl font-extrabold text-violet-600">{count}</p>
      </div>
      <Icon name="chevronRight" size={16} className="shrink-0 text-slate-300" />
    </Link>
  );
}
