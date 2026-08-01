import { approverRoleLabel } from "@/features/admin/labels";
import { APPROVAL_STATUS_LABELS } from "@/features/admin/approvalChain";
import { Icon } from "@/shared/ui/Icon";
import type { IconName } from "@/shared/ui/Icon";
import type { ClubApplicationApproval } from "@/shared/types";

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

interface ClubApplicationApprovalChainProps {
  approvals: ClubApplicationApproval[];
}

/** Çok kademeli zincir görünümü — tek adımda render edilmez (gürültü önleme). */
export default function ClubApplicationApprovalChain({ approvals }: ClubApplicationApprovalChainProps) {
  if (approvals.length <= 1) return null;

  const sorted = [...approvals].sort((a, b) => a.step - b.step);

  return (
    <ol className="mt-3 space-y-2 border-l-2 border-slate-100 pl-4">
      {sorted.map((row) => (
        <li key={row.step} className="relative">
          <span className="absolute -left-[1.35rem] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-slate-100">
            <Icon name={STATUS_ICON[row.status]} size={12} className="text-slate-500" />
          </span>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Kademe {row.step}
              </span>
              <span className={`chip text-[10px] ${STATUS_CHIP[row.status]}`}>
                {APPROVAL_STATUS_LABELS[row.status]}
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-700">
              {approverRoleLabel(row.approverRole)}
            </p>
            {row.reviewedAt && (
              <p className="mt-1 text-[11px] text-slate-500">
                {row.approver
                  ? `${row.approver.firstName} ${row.approver.lastName} · `
                  : ""}
                {new Date(row.reviewedAt).toLocaleString("tr-TR")}
              </p>
            )}
            {row.note && (
              <p className="mt-1 text-[11px] italic text-slate-500">"{row.note}"</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
