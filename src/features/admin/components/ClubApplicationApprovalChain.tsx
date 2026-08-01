import { approverRoleLabel } from "@/features/admin/labels";
import {
  APPROVAL_STATUS_LABELS,
  isCommitteeApprovalStep,
} from "@/features/admin/approvalChain";
import {
  committeeApprovalThreshold,
  formatCommitteeApprovalProgress,
} from "@/features/admin/committeeTallyDisplay";
import { Icon } from "@/shared/ui/Icon";
import type { IconName } from "@/shared/ui/Icon";
import type { ClubApplicationApproval, CommitteeApprovalTallyStudent } from "@/shared/types";

const STATUS_ICON: Record<ClubApplicationApproval["status"], IconName> = {
  pending: "pending",
  approved: "check",
  rejected: "reject",
  revision_requested: "edit",
};

const STATUS_CHIP: Record<ClubApplicationApproval["status"], string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  approved: "bg-green-50 text-green-700 border-green-100",
  rejected: "bg-red-50 text-red-700 border-red-100",
  revision_requested: "bg-violet-50 text-violet-700 border-violet-100",
};

function committeeStepTitle(row: ClubApplicationApproval): string {
  return row.committeeTally?.committeeName ?? "Onay kurulu";
}

function committeeStepSubtitle(
  row: ClubApplicationApproval,
  tally: CommitteeApprovalTallyStudent | undefined,
  studentView: boolean
): string | null {
  if (studentView) {
    const name = tally?.committeeName ?? "Kurul";
    if (row.status === "pending") return `${name} incelemesinde`;
    if (row.status === "approved") return `${name} onayı tamamlandı`;
    if (row.status === "rejected") return `${name} tarafından reddedildi`;
    if (row.status === "revision_requested") return `${name} revizyon istedi`;
    return `${name} kademesi`;
  }
  return null;
}

function CommitteeVoteProgress({
  tally,
  status,
}: {
  tally: CommitteeApprovalTallyStudent;
  status: ClubApplicationApproval["status"];
}) {
  const threshold = committeeApprovalThreshold(tally);
  const progressLabel = formatCommitteeApprovalProgress(tally.approveCount, threshold);
  const pct =
    threshold != null && threshold > 0
      ? Math.min(100, Math.round((tally.approveCount / threshold) * 100))
      : 0;
  const isComplete =
    status === "approved" || (threshold != null && tally.approveCount >= threshold);
  const isRejected = status === "rejected";

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <span className="font-semibold text-slate-700">Onay ilerlemesi: {progressLabel}</span>
        {status === "pending" && tally.notVotedCount > 0 && (
          <span className="chip text-[10px] bg-amber-50 text-amber-700 border-amber-100">
            {tally.notVotedCount} üye oy vermedi
          </span>
        )}
      </div>
      {threshold != null && (
        <div
          className="h-2 overflow-hidden rounded-full bg-slate-200/80"
          role="progressbar"
          aria-valuenow={tally.approveCount}
          aria-valuemin={0}
          aria-valuemax={threshold}
          aria-label={progressLabel}
        >
          <div
            className={`h-full rounded-full transition-all ${
              isRejected ? "bg-red-500" : isComplete ? "bg-green-500" : "bg-brand-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {status === "pending" && (
        <p className="text-[11px] text-slate-500">
          {threshold != null ? (
            <>
              Karar için {threshold} onay gerekir; {tally.notVotedCount} üye henüz oy vermedi — oy
              vermeyenler çoğunluğu engeller.
            </>
          ) : (
            <>
              Gerekli onay sayısı henüz bildirilmedi. {tally.notVotedCount} üye henüz oy vermedi — oy
              vermeyenler çoğunluğu engeller.
            </>
          )}
        </p>
      )}
    </div>
  );
}

interface ClubApplicationApprovalChainProps {
  approvals: ClubApplicationApproval[];
  showAllSteps?: boolean;
  studentView?: boolean;
}

export default function ClubApplicationApprovalChain({
  approvals,
  showAllSteps = false,
  studentView = false,
}: ClubApplicationApprovalChainProps) {
  if (!showAllSteps && approvals.length <= 1) return null;

  const sorted = [...approvals].sort((a, b) => a.step - b.step);

  return (
    <ol className="mt-3 space-y-2 border-l-2 border-slate-100 pl-4">
      {sorted.map((row) => {
        const isCommittee = isCommitteeApprovalStep(row);
        const tally = row.committeeTally;
        const title = isCommittee
          ? committeeStepTitle(row)
          : approverRoleLabel(row.approverRole ?? "club_approver");
        const subtitle = isCommittee
          ? committeeStepSubtitle(row, tally ?? undefined, studentView)
          : null;

        return (
          <li key={row.step} className="relative">
            <span className="absolute -left-[1.35rem] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-slate-100">
              <Icon name={STATUS_ICON[row.status]} size={12} className="text-slate-500" />
            </span>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Kademe {row.step}
                  {isCommittee && !studentView && (
                    <span className="ml-1 normal-case text-slate-500">· Kurul</span>
                  )}
                </span>
                <span className={`chip text-[10px] ${STATUS_CHIP[row.status]}`}>
                  {APPROVAL_STATUS_LABELS[row.status]}
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-700">{title}</p>
              {subtitle && <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>}
              {isCommittee && !studentView && tally && (
                <CommitteeVoteProgress tally={tally} status={row.status} />
              )}
              {!isCommittee && row.reviewedAt && (
                <p className="mt-1 text-[11px] text-slate-500">
                  {row.approver
                    ? `${row.approver.firstName} ${row.approver.lastName} · `
                    : ""}
                  {new Date(row.reviewedAt).toLocaleString("tr-TR")}
                </p>
              )}
              {!isCommittee && row.note && (
                <p className="mt-1 text-[11px] italic text-slate-500">"{row.note}"</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
