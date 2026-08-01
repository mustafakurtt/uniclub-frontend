import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import FormationProposalProgress from "@/features/clubs/formation/FormationProposalProgress";
import {
  FORMATION_PROPOSAL_STATUS_CHIP,
  FORMATION_PROPOSAL_STATUS_LABELS,
  formationDaysRemainingLabel,
} from "@/features/clubs/formation/formationProposalLabels";
import { adminDetailQuery } from "@/features/admin/adminListNav";
import { getAdminFormationProposals } from "@/features/admin/api";
import { getErrorMessage } from "@/shared/api/client";
import type { FormationProposal, FormationProposalStatus } from "@/shared/types";

const STATUS_FILTERS: { key: FormationProposalStatus | "all"; label: string }[] = [
  { key: "collecting_support", label: "Destek toplanıyor" },
  { key: "submitted", label: "Gönderildi" },
  { key: "expired", label: "Süresi doldu" },
  { key: "all", label: "Tümü" },
];

interface FormationProposalsSectionProps {
  universityId: string;
  statusFilter: FormationProposalStatus | "all";
  onStatusFilterChange: (status: FormationProposalStatus | "all") => void;
}

export default function FormationProposalsSection({
  universityId,
  statusFilter,
  onStatusFilterChange,
}: FormationProposalsSectionProps) {
  const proposalsQuery = useQuery({
    queryKey: ["admin", universityId, "formation-proposals", statusFilter],
    queryFn: () =>
      getAdminFormationProposals(
        universityId,
        statusFilter === "all" ? undefined : statusFilter
      ),
  });

  const proposals = proposalsQuery.data ?? [];

  return (
    <section className="card p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="icon-tile">
            <Icon name="seedling" size={24} className="text-brand-600" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Kuruluş Önerileri</h2>
            <p className="text-xs text-slate-500">
              Dijital destek toplama — destekçi listesi yalnızca detayda görünür.
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

      {proposalsQuery.isLoading ? (
        <div className="space-y-3">
          <div className="skeleton h-14 w-full" />
          <div className="skeleton h-14 w-full" />
        </div>
      ) : proposalsQuery.isError ? (
        <div className="alert-error">
          {getErrorMessage(proposalsQuery.error, "Öneriler yüklenemedi.")}
        </div>
      ) : proposals.length === 0 ? (
        <EmptyState icon="seedling" title="Bu filtrede kuruluş önerisi yok" />
      ) : (
        <ul className="divide-y divide-slate-100">
          {proposals.map((proposal) => (
            <FormationProposalAdminRow
              key={proposal.id}
              proposal={proposal}
              statusFilter={statusFilter}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function FormationProposalAdminRow({
  proposal,
  statusFilter,
}: {
  proposal: FormationProposal;
  statusFilter: FormationProposalStatus | "all";
}) {
  const detailHref = `/admin/proposals/${proposal.id}${adminDetailQuery("formation", statusFilter)}`;

  return (
    <li>
      <Link
        to={detailHref}
        className="flex flex-wrap items-center justify-between gap-3 py-3 transition-colors hover:bg-slate-50/80 -mx-2 px-2 rounded-xl"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-display text-sm font-bold text-slate-900">
              {proposal.proposedName}
            </p>
            <span
              className={`chip text-[10px] ${FORMATION_PROPOSAL_STATUS_CHIP[proposal.status]}`}
            >
              {FORMATION_PROPOSAL_STATUS_LABELS[proposal.status]}
            </span>
          </div>
          {proposal.proposer && (
            <p className="mt-0.5 text-xs text-slate-500">
              {proposal.proposer.firstName} {proposal.proposer.lastName}
            </p>
          )}
          {proposal.supportThreshold > 0 && (
            <div className="mt-2 max-w-xs">
              <FormationProposalProgress
                supportCount={proposal.supportCount}
                supportThreshold={proposal.supportThreshold}
              />
            </div>
          )}
          <p className="mt-1 text-[11px] text-slate-400">
            {proposal.status === "expired"
              ? "Süresi doldu"
              : formationDaysRemainingLabel(proposal.expiresAt)}
          </p>
        </div>
        <Icon name="chevronRight" size={18} className="shrink-0 text-slate-300" />
      </Link>
    </li>
  );
}
