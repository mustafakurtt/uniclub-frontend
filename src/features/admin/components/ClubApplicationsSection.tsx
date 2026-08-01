import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import {
  approveClubApplication,
  getClubApplications,
  rejectClubApplication,
  requestClubApplicationRevision,
  type AdminClubApplication,
} from "@/features/admin/api";
import { getApplicationDecisionState } from "@/features/admin/approvalChain";
import ClubApplicationHistoryModal from "@/features/admin/components/ClubApplicationHistoryModal";
import ClubApplicationListItem from "@/features/admin/components/ClubApplicationListItem";
import ClubApplicationNoteDialog from "@/features/admin/components/ClubApplicationNoteDialog";
import { useAuth } from "@/features/auth/hooks/useAuth";
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
}

type DecisionKind = "approve" | "reject" | "revision";

type PendingDecision =
  | { kind: DecisionKind; application: AdminClubApplication }
  | null;

export default function ClubApplicationsSection({ universityId }: ClubApplicationsSectionProps) {
  const queryClient = useQueryClient();
  const { roleNames, hasPermission } = useAuth();
  const hasClubApprove = hasPermission("club.approve");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("pending");
  const [decision, setDecision] = useState<PendingDecision>(null);
  const [historyApp, setHistoryApp] = useState<AdminClubApplication | null>(null);

  const applicationsQuery = useQuery({
    queryKey: ["admin", universityId, "club-applications", statusFilter],
    queryFn: () =>
      getClubApplications(universityId, statusFilter === "all" ? undefined : statusFilter),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", universityId, "club-applications"] });
    queryClient.invalidateQueries({ queryKey: ["admin", universityId, "club-application-history"] });
    queryClient.invalidateQueries({ queryKey: ["admin", universityId, "clubs"] });
  };

  const decideMutation = useMutation({
    mutationFn: async (payload: NonNullable<PendingDecision> & { note?: string }) => {
      const { kind, application, note } = payload;
      if (kind === "approve") {
        await approveClubApplication(universityId, application.id);
      } else if (kind === "reject") {
        await rejectClubApplication(universityId, application.id, { note: note ?? "" });
      } else {
        await requestClubApplicationRevision(universityId, application.id, { note: note ?? "" });
      }
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
            <ClubApplicationListItem
              key={app.id}
              application={app}
              decisionState={
                app.status === "pending"
                  ? getApplicationDecisionState(app.approvals, roleNames, hasClubApprove)
                  : null
              }
              decidePending={decideMutation.isPending}
              onDecide={(kind, application) => setDecision({ kind, application })}
              onShowHistory={setHistoryApp}
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={decision?.kind === "approve"}
        title={
          decision?.kind === "approve"
            ? `"${decision.application.proposedName}" onaylansın mı?`
            : ""
        }
        description="Gerçek bir kulüp oluşturulur ve başvuran otomatik başkan olur."
        confirmLabel="Onayla ve Kulübü Oluştur"
        tone="primary"
        loading={decideMutation.isPending}
        error={
          decideMutation.isError && decision?.kind === "approve"
            ? getErrorMessage(decideMutation.error, "Karar kaydedilemedi.")
            : null
        }
        onConfirm={() => decision?.kind === "approve" && decideMutation.mutate(decision)}
        onClose={() => {
          setDecision(null);
          decideMutation.reset();
        }}
      />

      <ClubApplicationNoteDialog
        variant="reject"
        open={decision?.kind === "reject"}
        clubName={decision?.kind === "reject" ? decision.application.proposedName : ""}
        loading={decideMutation.isPending}
        error={decideMutation.isError && decision?.kind === "reject" ? decideMutation.error : null}
        onConfirm={(note) =>
          decision?.kind === "reject" && decideMutation.mutate({ ...decision, note })
        }
        onClose={() => {
          setDecision(null);
          decideMutation.reset();
        }}
      />

      <ClubApplicationNoteDialog
        variant="revision"
        open={decision?.kind === "revision"}
        clubName={decision?.kind === "revision" ? decision.application.proposedName : ""}
        loading={decideMutation.isPending}
        error={
          decideMutation.isError && decision?.kind === "revision" ? decideMutation.error : null
        }
        onConfirm={(note) =>
          decision?.kind === "revision" && decideMutation.mutate({ ...decision, note })
        }
        onClose={() => {
          setDecision(null);
          decideMutation.reset();
        }}
      />

      {historyApp && (
        <ClubApplicationHistoryModal
          open
          universityId={universityId}
          applicationId={historyApp.id}
          clubName={historyApp.proposedName}
          onClose={() => setHistoryApp(null)}
        />
      )}
    </section>
  );
}
