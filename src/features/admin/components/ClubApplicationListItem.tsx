import { Icon } from "@/shared/ui/Icon";
import type { AdminClubApplication } from "@/features/admin/api";
import ClubApplicationApprovalChain from "@/features/admin/components/ClubApplicationApprovalChain";
import {
  APPLICATION_STATUS_CHIP,
  APPLICATION_STATUS_LABELS,
} from "@/features/clubs/applicationLabels";
import type { ApplicationDecisionState } from "@/features/admin/approvalChain";

type DecisionKind = "approve" | "reject" | "revision";

interface ClubApplicationListItemProps {
  application: AdminClubApplication;
  decisionState: ApplicationDecisionState | null;
  decidePending: boolean;
  onDecide: (kind: DecisionKind, application: AdminClubApplication) => void;
  onShowHistory: (application: AdminClubApplication) => void;
}

export default function ClubApplicationListItem({
  application,
  decisionState,
  decidePending,
  onDecide,
  onShowHistory,
}: ClubApplicationListItemProps) {
  const app = application;

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-display text-sm font-bold text-slate-900">{app.proposedName}</p>
            {app.status !== "pending" && (
              <span className={`chip text-[10px] ${APPLICATION_STATUS_CHIP[app.status]}`}>
                {APPLICATION_STATUS_LABELS[app.status]}
              </span>
            )}
          </div>
          {app.description && (
            <p className="mt-0.5 line-clamp-2 max-w-xl text-xs text-slate-500">{app.description}</p>
          )}
          <p className="mt-1 text-[11px] font-semibold text-slate-400">
            {app.applicant ? `${app.applicant.firstName} ${app.applicant.lastName} · ` : ""}
            {new Date(app.createdAt).toLocaleDateString("tr-TR")}
          </p>
          {app.approvals && <ClubApplicationApprovalChain approvals={app.approvals} />}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            type="button"
            className="btn-ghost px-2 py-1 text-[11px]"
            onClick={() => onShowHistory(app)}
          >
            <Icon name="audit" size={13} /> Geçmiş
          </button>

          {app.status === "pending" ? (
            <>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
                  disabled={!decisionState?.canDecide || decidePending}
                  title={decisionState?.disabledReason ?? undefined}
                  onClick={() => onDecide("approve", app)}
                >
                  <Icon name="check" size={14} /> Onayla
                </button>
                <button
                  type="button"
                  className="btn-ghost px-3 py-1.5 text-xs text-violet-700 hover:bg-violet-50 disabled:opacity-50"
                  disabled={!decisionState?.canDecide || decidePending}
                  title={decisionState?.disabledReason ?? undefined}
                  onClick={() => onDecide("revision", app)}
                >
                  <Icon name="edit" size={14} /> Revizyon İste
                </button>
                <button
                  type="button"
                  className="btn-ghost px-3 py-1.5 text-xs text-slate-400 hover:text-red-600 disabled:opacity-50"
                  disabled={!decisionState?.canDecide || decidePending}
                  title={decisionState?.disabledReason ?? undefined}
                  onClick={() => onDecide("reject", app)}
                >
                  <Icon name="reject" size={14} /> Reddet
                </button>
              </div>
              {decisionState?.disabledReason && (
                <p className="max-w-[16rem] text-right text-[10px] text-slate-400">
                  {decisionState.disabledReason}
                </p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </li>
  );
}
