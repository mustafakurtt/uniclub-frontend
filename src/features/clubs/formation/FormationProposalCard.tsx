import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Icon } from "@/shared/ui/Icon";
import FormationProposalProgress from "@/features/clubs/formation/FormationProposalProgress";
import {
  FORMATION_PROPOSAL_STATUS_CHIP,
  FORMATION_PROPOSAL_STATUS_LABELS,
  formationDaysRemainingLabel,
} from "@/features/clubs/formation/formationProposalLabels";
import type { FormationProposal } from "@/shared/types";

interface FormationProposalCardProps {
  proposal: FormationProposal;
  onSupport?: () => void;
  onWithdrawSupport?: () => void;
  actionPending?: boolean;
  actionError?: string | null;
}

export default function FormationProposalCard({
  proposal,
  onSupport,
  onWithdrawSupport,
  actionPending,
  actionError,
}: FormationProposalCardProps) {
  const { user } = useAuth();
  const isProposer = user?.id === proposal.proposer?.id;
  const canAct =
    proposal.status === "collecting_support" &&
    !isProposer &&
    onSupport &&
    onWithdrawSupport;

  return (
    <article className="card-hover flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            to={`/clubs/proposals/${proposal.id}`}
            className="font-display text-base font-bold text-slate-900 hover:text-brand-700"
          >
            {proposal.proposedName}
          </Link>
          {proposal.proposer && (
            <p className="mt-0.5 text-xs text-slate-500">
              {proposal.proposer.firstName} {proposal.proposer.lastName}
            </p>
          )}
        </div>
        <span
          className={`chip text-[10px] ${FORMATION_PROPOSAL_STATUS_CHIP[proposal.status]}`}
        >
          {FORMATION_PROPOSAL_STATUS_LABELS[proposal.status]}
        </span>
      </div>

      {proposal.description && (
        <p className="line-clamp-2 text-sm text-slate-600">{proposal.description}</p>
      )}

      {proposal.supportThreshold > 0 && (
        <FormationProposalProgress
          supportCount={proposal.supportCount}
          supportThreshold={proposal.supportThreshold}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-400">
          <Icon name="calendar" size={12} className="mr-1 inline" />
          {formationDaysRemainingLabel(proposal.expiresAt)}
        </span>

        {canAct && (
          <button
            type="button"
            className={proposal.hasSupported ? "btn-ghost text-xs" : "btn-secondary text-xs"}
            disabled={actionPending}
            onClick={proposal.hasSupported ? onWithdrawSupport : onSupport}
          >
            {proposal.hasSupported ? "Desteği geri çek" : "Destekle"}
          </button>
        )}
      </div>

      {actionError && <p className="text-xs text-red-600">{actionError}</p>}
    </article>
  );
}
