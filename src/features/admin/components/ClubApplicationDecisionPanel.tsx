import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import { Icon } from "@/shared/ui/Icon";
import ClubApplicationNoteDialog from "@/features/admin/components/ClubApplicationNoteDialog";
import {
  approveClubApplication,
  rejectClubApplication,
  requestClubApplicationRevision,
  type AdminClubApplication,
} from "@/features/admin/api";
import type { ApplicationDecisionState } from "@/features/admin/approvalChain";
import { getApplicationDecisionErrorMessage } from "@/features/admin/applicationDecisionErrors";

type DecisionKind = "approve" | "reject" | "revision";

type PendingDecision =
  | { kind: DecisionKind; application: AdminClubApplication }
  | null;

interface ClubApplicationDecisionPanelProps {
  universityId: string;
  application: AdminClubApplication;
  decisionState: ApplicationDecisionState | null;
}

export default function ClubApplicationDecisionPanel({
  universityId,
  application,
  decisionState,
}: ClubApplicationDecisionPanelProps) {
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState<PendingDecision>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", universityId, "club-applications"] });
    queryClient.invalidateQueries({
      queryKey: ["admin", universityId, "club-application", application.id],
    });
    queryClient.invalidateQueries({
      queryKey: ["admin", universityId, "club-application-history", application.id],
    });
    queryClient.invalidateQueries({
      queryKey: ["admin", universityId, "club-application-checklist", application.id],
    });
    queryClient.invalidateQueries({ queryKey: ["admin", universityId, "clubs"] });
  };

  const decideMutation = useMutation({
    mutationFn: async (payload: NonNullable<PendingDecision> & { note?: string }) => {
      const { kind, application: app, note } = payload;
      if (kind === "approve") {
        await approveClubApplication(universityId, app.id);
      } else if (kind === "reject") {
        await rejectClubApplication(universityId, app.id, { note: note ?? "" });
      } else {
        await requestClubApplicationRevision(universityId, app.id, { note: note ?? "" });
      }
    },
    onSuccess: () => {
      invalidate();
      setDecision(null);
    },
  });

  if (application.status !== "pending") return null;

  return (
    <section className="card border-brand-100 bg-brand-50/30 p-5">
      <h2 className="font-display text-base font-bold text-slate-900">Karar ver</h2>
      <p className="mt-1 text-sm text-slate-600">
        Onay gerçek bir kulüp oluşturur; başvuran otomatik başkan olur.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-secondary text-sm disabled:opacity-50"
          disabled={!decisionState?.canDecide || decideMutation.isPending}
          title={decisionState?.disabledReason ?? undefined}
          onClick={() => setDecision({ kind: "approve", application })}
        >
          <Icon name="check" size={14} /> Onayla
        </button>
        <button
          type="button"
          className="btn-ghost text-sm text-violet-700 hover:bg-violet-50 disabled:opacity-50"
          disabled={!decisionState?.canDecide || decideMutation.isPending}
          title={decisionState?.disabledReason ?? undefined}
          onClick={() => setDecision({ kind: "revision", application })}
        >
          <Icon name="edit" size={14} /> Revizyon İste
        </button>
        <button
          type="button"
          className="btn-ghost text-sm text-slate-500 hover:text-red-600 disabled:opacity-50"
          disabled={!decisionState?.canDecide || decideMutation.isPending}
          title={decisionState?.disabledReason ?? undefined}
          onClick={() => setDecision({ kind: "reject", application })}
        >
          <Icon name="reject" size={14} /> Reddet
        </button>
      </div>

      {decisionState?.disabledReason && (
        <p className="mt-2 text-xs text-slate-500">{decisionState.disabledReason}</p>
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
            ? getApplicationDecisionErrorMessage(decideMutation.error, "Karar kaydedilemedi.")
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
    </section>
  );
}
