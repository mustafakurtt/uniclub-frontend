import { approverRoleLabel } from "@/features/admin/labels";
import {
  APPROVAL_STATUS_LABELS,
  isCommitteeApprovalStep,
} from "@/features/admin/approvalChain";
import { Icon } from "@/shared/ui/Icon";
import type { IconName } from "@/shared/ui/Icon";
import type { ApprovalCommittee, ClubApplicationApproval, CommitteeVoteTally } from "@/shared/types";

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

function committeeStepTitle(
  row: ClubApplicationApproval,
  committeesById: Record<string, ApprovalCommittee>
): string {
  if (row.committeeId && committeesById[row.committeeId]) {
    return committeesById[row.committeeId].name;
  }
  return "Onay kurulu";
}

function committeeStepSubtitle(
  row: ClubApplicationApproval,
  committeesById: Record<string, ApprovalCommittee>,
  tally: CommitteeVoteTally | undefined,
  studentView: boolean
): string {
  const committee = row.committeeId ? committeesById[row.committeeId] : undefined;
  if (studentView) {
    if (row.status === "pending") return "Kurul incelemesinde";
    if (row.status === "approved") return "Kurul onayı tamamlandı";
    if (row.status === "rejected") return "Kurul tarafından reddedildi";
    if (row.status === "revision_requested") return "Kurul revizyon istedi";
    return "Kurul kademesi";
  }

  const memberCount = tally?.memberCount ?? committee?.members.length;
  if (tally) {
    const abstaining = tally.memberCount - tally.votes;
    return `${tally.approveCount} / ${tally.threshold} onay · ${abstaining} üye henüz oy vermedi`;
  }
  if (memberCount != null) {
    return `${memberCount} üye · salt çoğunluk oylaması`;
  }
  return "Salt çoğunluk oylaması";
}

interface ClubApplicationApprovalChainProps {
  approvals: ClubApplicationApproval[];
  /** Detay sayfasında tek kademeli zinciri de göster. */
  showAllSteps?: boolean;
  /** Öğrenci yüzeyi — kurul oyu detayı gösterilmez. */
  studentView?: boolean;
  committeesById?: Record<string, ApprovalCommittee>;
  tallyByStep?: Record<number, CommitteeVoteTally>;
}

/** Çok kademeli zincir görünümü — listede tek adımda gizlenir. */
export default function ClubApplicationApprovalChain({
  approvals,
  showAllSteps = false,
  studentView = false,
  committeesById = {},
  tallyByStep = {},
}: ClubApplicationApprovalChainProps) {
  if (!showAllSteps && approvals.length <= 1) return null;

  const sorted = [...approvals].sort((a, b) => a.step - b.step);

  return (
    <ol className="mt-3 space-y-2 border-l-2 border-slate-100 pl-4">
      {sorted.map((row) => {
        const isCommittee = isCommitteeApprovalStep(row);
        const title = isCommittee
          ? committeeStepTitle(row, committeesById)
          : approverRoleLabel(row.approverRole ?? "club_approver");
        const subtitle = isCommittee
          ? committeeStepSubtitle(row, committeesById, tallyByStep[row.step], studentView)
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
