import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { isForbiddenAdminError } from "@/features/admin/adminQueryErrors";
import { getClubApplications } from "@/features/admin/api/applications";
import { getAdminFormationProposals } from "@/features/admin/api/formationProposals";
import { MODERATION_PERMISSIONS } from "@/features/auth/authorization";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getErrorMessage } from "@/shared/api/client";
import { Icon } from "@/shared/ui/Icon";

function QueueCard({
  to,
  icon,
  title,
  count,
  loading,
}: {
  to: string;
  icon: "inbox" | "seedling" | "moderation";
  title: string;
  count: number | undefined;
  loading: boolean;
}) {
  return (
    <Link to={to} className="card card-hover flex items-center gap-4 p-5">
      <span className="icon-tile">
        <Icon name={icon} size={24} className="text-brand-600" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-bold text-slate-900">{title}</p>
        <p className="text-2xl font-extrabold text-brand-600">
          {loading ? "…" : (count ?? 0)}
        </p>
      </div>
      <Icon name="chevronRight" size={16} className="shrink-0 text-slate-300" />
    </Link>
  );
}

export default function HomeWorkQueue({ universityId }: { universityId: string }) {
  const { hasPermission } = useAuth();
  const canViewApplications = hasPermission("application.view");
  const canModerate =
    hasPermission("club.view") && MODERATION_PERMISSIONS.some((p) => hasPermission(p));

  const applicationsQuery = useQuery({
    queryKey: ["admin", universityId, "club-applications", "pending"],
    queryFn: () => getClubApplications(universityId, "pending"),
    enabled: canViewApplications,
    retry: false,
  });

  const proposalsQuery = useQuery({
    queryKey: ["admin", universityId, "formation-proposals", "collecting_support"],
    queryFn: () => getAdminFormationProposals(universityId, "collecting_support"),
    enabled: canViewApplications,
    retry: false,
  });

  const systemError = [applicationsQuery, proposalsQuery].find(
    (query) => query.isError && !isForbiddenAdminError(query.error)
  );

  const error = systemError
    ? getErrorMessage(systemError.error, "Kuyruk yüklenemedi.")
    : null;

  const showApplications =
    canViewApplications &&
    !(applicationsQuery.isError && isForbiddenAdminError(applicationsQuery.error));
  const showProposals =
    canViewApplications &&
    !(proposalsQuery.isError && isForbiddenAdminError(proposalsQuery.error));

  if (!showApplications && !showProposals && !canModerate) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold text-slate-900">Günlük iş kuyruğu</h2>
        <p className="mt-1 text-sm text-slate-500">
          Bekleyen başvurular ve kuruluş önerileri — yapılandırma değil, iş akışı.
        </p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {showApplications && (
          <QueueCard
            to="/admin/clubs?tab=applications&status=pending"
            icon="inbox"
            title="Karar bekleyen başvurular"
            count={applicationsQuery.data?.length}
            loading={applicationsQuery.isLoading}
          />
        )}
        {showProposals && (
          <QueueCard
            to="/admin/clubs?tab=formation&status=collecting_support"
            icon="seedling"
            title="Destek toplayan öneriler"
            count={proposalsQuery.data?.length}
            loading={proposalsQuery.isLoading}
          />
        )}
        {canModerate && (
          <QueueCard
            to="/admin/moderation"
            icon="moderation"
            title="İçerik moderasyonu"
            count={undefined}
            loading={false}
          />
        )}
      </div>
    </div>
  );
}
