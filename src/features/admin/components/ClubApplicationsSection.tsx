import { useQuery } from "@tanstack/react-query";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import { getClubApplications } from "@/features/admin/api";
import ClubApplicationListItem from "@/features/admin/components/ClubApplicationListItem";
import { getErrorMessage } from "@/shared/api/client";
import type { ApplicationStatus } from "@/shared/types";

const STATUS_FILTERS: { key: ApplicationStatus | "all"; label: string }[] = [
  { key: "pending", label: "Karar bekleyen" },
  { key: "revision_requested", label: "Revizyon bekleyen" },
  { key: "approved", label: "Onaylanan" },
  { key: "rejected", label: "Reddedilen" },
  { key: "all", label: "Tümü" },
];

interface ClubApplicationsSectionProps {
  universityId: string;
  statusFilter: ApplicationStatus | "all";
  onStatusFilterChange: (status: ApplicationStatus | "all") => void;
}

export default function ClubApplicationsSection({
  universityId,
  statusFilter,
  onStatusFilterChange,
}: ClubApplicationsSectionProps) {
  const applicationsQuery = useQuery({
    queryKey: ["admin", universityId, "club-applications", statusFilter],
    queryFn: () =>
      getClubApplications(universityId, statusFilter === "all" ? undefined : statusFilter),
  });

  const applications = applicationsQuery.data ?? [];

  return (
    <section className="card p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="icon-tile">
            <Icon name="inbox" size={24} className="text-brand-600" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Kulüp Başvuruları</h2>
            <p className="text-xs text-slate-500">
              Onay, gerçek bir kulüp oluşturur — başvuran başkan olur.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => onStatusFilterChange(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                statusFilter === f.key
                  ? "bg-brand-600 text-white shadow-glow"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-brand-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {applicationsQuery.isLoading ? (
        <div className="space-y-3">
          <div className="skeleton h-14 w-full" />
          <div className="skeleton h-14 w-full" />
        </div>
      ) : applicationsQuery.isError ? (
        <div className="alert-error">
          {getErrorMessage(applicationsQuery.error, "Başvurular yüklenemedi.")}
        </div>
      ) : applications.length === 0 ? (
        <EmptyState icon="inbox" title="Bu filtrede başvuru yok" />
      ) : (
        <ul className="divide-y divide-slate-100">
          {applications.map((app) => (
            <ClubApplicationListItem
              key={app.id}
              application={app}
              statusFilter={statusFilter}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
