import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import EmptyState from "@/shared/ui/EmptyState";
import RequirePermission from "@/features/auth/guards/RequirePermission";
import { Icon } from "@/shared/ui/Icon";
import {
  approveClubApplication,
  getClubApplications,
  rejectClubApplication,
  type AdminClubApplication,
} from "@/features/admin/api";
import { getErrorMessage } from "@/shared/api/client";
import type { ApplicationStatus } from "@/shared/types";

// Kulüp kurma başvuruları (FRONTEND_CLUBS.md §11) — `club.approve` yetkisi.
// Onay GERÇEK kulüp oluşturur ve başvuran otomatik BAŞKAN olur; bu yüzden
// her iki karar da onay diyaloğundan geçer.

const STATUS_FILTERS: { key: ApplicationStatus | "all"; label: string }[] = [
  { key: "pending", label: "Bekleyen" },
  { key: "approved", label: "Onaylanan" },
  { key: "rejected", label: "Reddedilen" },
  { key: "all", label: "Tümü" },
];

const STATUS_CHIPS: Record<ApplicationStatus, string> = {
  pending: "Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

interface ClubApplicationsSectionProps {
  universityId: string;
}

type PendingDecision = { kind: "approve" | "reject"; application: AdminClubApplication } | null;

export default function ClubApplicationsSection({ universityId }: ClubApplicationsSectionProps) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("pending");
  const [decision, setDecision] = useState<PendingDecision>(null);

  const applicationsQuery = useQuery({
    queryKey: ["admin", universityId, "club-applications", statusFilter],
    queryFn: () =>
      getClubApplications(universityId, statusFilter === "all" ? undefined : statusFilter),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", universityId, "club-applications"] });
    // Onay yeni kulüp yaratır → kulüp listesi de bayatlar
    queryClient.invalidateQueries({ queryKey: ["admin", universityId, "clubs"] });
  };

  const decideMutation = useMutation({
    mutationFn: async ({ kind, application }: NonNullable<PendingDecision>) => {
      if (kind === "approve") await approveClubApplication(universityId, application.id);
      else await rejectClubApplication(universityId, application.id);
    },
    onSuccess: () => {
      invalidate();
      setDecision(null);
    },
  });

  const applications = applicationsQuery.data ?? [];

  return (
    <section className="card p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="icon-tile"><Icon name="inbox" size={24} className="text-brand-600" /></span>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Kulüp Başvuruları</h2>
            <p className="text-xs text-slate-500">Onay, gerçek bir kulüp oluşturur — başvuran başkan olur.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
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
            <li key={app.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-slate-900">
                  {app.proposedName}
                </p>
                {app.description && (
                  <p className="mt-0.5 line-clamp-2 max-w-xl text-xs text-slate-500">{app.description}</p>
                )}
                <p className="mt-1 text-[11px] font-semibold text-slate-400">
                  {app.applicant
                    ? `${app.applicant.firstName} ${app.applicant.lastName} · `
                    : ""}
                  {new Date(app.createdAt).toLocaleDateString("tr-TR")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {app.status === "pending" ? (
                  <RequirePermission
                    permission="club.approve"
                    fallback={<span className="chip">{STATUS_CHIPS.pending}</span>}
                  >
                    <button
                      className="btn-secondary px-3 py-1.5 text-xs"
                      onClick={() => setDecision({ kind: "approve", application: app })}
                    >
                      <Icon name="check" size={14} /> Onayla
                    </button>
                    <button
                      className="btn-ghost px-3 py-1.5 text-xs text-slate-400 hover:text-red-600"
                      onClick={() => setDecision({ kind: "reject", application: app })}
                    >
                      <Icon name="reject" size={14} /> Reddet
                    </button>
                  </RequirePermission>
                ) : (
                  <span className="chip">{STATUS_CHIPS[app.status]}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!decision}
        title={
          decision?.kind === "approve"
            ? `"${decision.application.proposedName}" onaylansın mı?`
            : `"${decision?.application.proposedName}" reddedilsin mi?`
        }
        description={
          decision?.kind === "approve"
            ? "Gerçek bir kulüp oluşturulur ve başvuran otomatik başkan olur."
            : "Kulüp oluşturulmaz; başvuran daha sonra yeniden başvurabilir."
        }
        confirmLabel={decision?.kind === "approve" ? "Onayla ve Kulübü Oluştur" : "Reddet"}
        tone={decision?.kind === "approve" ? "primary" : "danger"}
        loading={decideMutation.isPending}
        error={
          decideMutation.isError
            ? getErrorMessage(decideMutation.error, "Karar kaydedilemedi.")
            : null
        }
        onConfirm={() => decision && decideMutation.mutate(decision)}
        onClose={() => {
          setDecision(null);
          decideMutation.reset();
        }}
      />
    </section>
  );
}
