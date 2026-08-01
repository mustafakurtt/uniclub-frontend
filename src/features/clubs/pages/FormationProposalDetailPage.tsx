import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import PageLoader from "@/shared/ui/PageLoader";
import { Icon } from "@/shared/ui/Icon";
import FormationProposalProgress from "@/features/clubs/formation/FormationProposalProgress";
import FormationProposalSubmittedSection, {
  FormationProposalCollectingSection,
} from "@/features/clubs/formation/FormationProposalStatusSections";
import {
  FORMATION_PROPOSAL_STATUS_CHIP,
  FORMATION_PROPOSAL_STATUS_LABELS,
  formationDaysRemainingLabel,
} from "@/features/clubs/formation/formationProposalLabels";
import {
  getFormationProposal,
  supportFormationProposal,
  withdrawFormationProposal,
  withdrawFormationSupport,
} from "@/features/clubs/api/formationProposals";
import { getErrorMessage, getErrorCode } from "@/shared/api/client";

const FORMATION_ERROR_HINTS: Record<string, string> = {
  "club.cannotSupportOwnProposal": "Kendi önerinize destek veremezsiniz.",
  "club.formationAlreadySupported": "Bu öneriyi zaten desteklediniz.",
  "club.formationSupportNotFound": "Aktif bir destek kaydınız bulunmuyor.",
  "club.formationProposalNotWithdrawable": "Yalnızca destek toplama aşamasındaki öneri geri çekilebilir.",
};

function formationActionError(error: unknown, fallback: string): string {
  const code = getErrorCode(error);
  if (code && FORMATION_ERROR_HINTS[code]) return FORMATION_ERROR_HINTS[code];
  return getErrorMessage(error, fallback);
}

export default function FormationProposalDetailPage() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ["formation-proposal", proposalId],
    queryFn: () => getFormationProposal(proposalId!),
    enabled: !!proposalId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["formation-proposal", proposalId] });
    queryClient.invalidateQueries({ queryKey: ["formation-proposals"] });
  };

  const supportMutation = useMutation({
    mutationFn: () => supportFormationProposal(proposalId!),
    onSuccess: invalidate,
    onError: (e) => setActionError(formationActionError(e, "Destek kaydedilemedi.")),
  });

  const withdrawSupportMutation = useMutation({
    mutationFn: () => withdrawFormationSupport(proposalId!),
    onSuccess: invalidate,
    onError: (e) => setActionError(formationActionError(e, "Destek geri çekilemedi.")),
  });

  const withdrawProposalMutation = useMutation({
    mutationFn: () => withdrawFormationProposal(proposalId!),
    onSuccess: () => {
      invalidate();
      navigate("/clubs/proposals");
    },
    onError: (e) => setActionError(formationActionError(e, "Öneri geri çekilemedi.")),
  });

  if (!proposalId) {
    return <div className="alert-error">Geçersiz öneri bağlantısı.</div>;
  }

  if (detailQuery.isLoading) {
    return <PageLoader label="Öneri yükleniyor…" />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="card p-8 text-center">
        <p className="font-semibold text-slate-700">Kuruluş önerisi bulunamadı.</p>
        <Link to="/clubs/proposals" className="btn-ghost mt-4 inline-flex">
          Listeye dön
        </Link>
      </div>
    );
  }

  const proposal = detailQuery.data;
  const isCollecting = proposal.status === "collecting_support";
  const isExpired = proposal.status === "expired";
  const submitted = proposal.status === "submitted" && proposal.applicationId;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/clubs/proposals" className="btn-ghost px-0 text-sm">
        <Icon name="arrowLeft" size={14} /> Önerilere dön
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-extrabold text-slate-900">
          {proposal.proposedName}
        </h1>
        <span className={`chip ${FORMATION_PROPOSAL_STATUS_CHIP[proposal.status]}`}>
          {FORMATION_PROPOSAL_STATUS_LABELS[proposal.status]}
        </span>
      </div>

      {proposal.proposer && !proposal.isProposer && (
        <p className="text-sm text-slate-500">
          Öneren: {proposal.proposer.firstName} {proposal.proposer.lastName}
        </p>
      )}

      {proposal.description && (
        <p className="text-sm text-slate-600 whitespace-pre-wrap">{proposal.description}</p>
      )}

      {proposal.isProposer && proposal.status === "collecting_support" && (
        <FormationProposalCollectingSection proposal={proposal} />
      )}

      {!proposal.isProposer && proposal.supportThreshold > 0 && (
        <FormationProposalProgress
          supportCount={proposal.supportCount}
          supportThreshold={proposal.supportThreshold}
        />
      )}

      {!(proposal.isProposer && proposal.status === "collecting_support") && (
        <p className="text-xs font-semibold text-slate-400">
          {isExpired
            ? "Bu önerinin destek toplama süresi doldu."
            : formationDaysRemainingLabel(proposal.expiresAt)}
        </p>
      )}

      {submitted && proposal.isProposer && <FormationProposalSubmittedSection proposal={proposal} />}

      {submitted && !proposal.isProposer && (
        <div className="alert-success text-sm">
          <p className="font-semibold">Bu öneri başvuruya dönüştü.</p>
          <p className="mt-1">Yeterli destek toplandı; SKS incelemesine aktarıldı.</p>
        </div>
      )}

      {proposal.isProposer && isCollecting && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-ghost text-xs text-red-600"
            onClick={() => setWithdrawOpen(true)}
          >
            Öneriyi geri çek
          </button>
        </div>
      )}

      {!proposal.isProposer && isCollecting && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary"
            disabled={proposal.hasSupported || supportMutation.isPending}
            onClick={() => supportMutation.mutate()}
          >
            {supportMutation.isPending ? "Kaydediliyor…" : "Destekle"}
          </button>
          {proposal.hasSupported && (
            <button
              type="button"
              className="btn-ghost"
              disabled={withdrawSupportMutation.isPending}
              onClick={() => withdrawSupportMutation.mutate()}
            >
              Desteği geri çek
            </button>
          )}
        </div>
      )}

      {actionError && <div className="alert-error text-sm">{actionError}</div>}

      <ConfirmDialog
        open={withdrawOpen}
        title={`"${proposal.proposedName}" önerisi geri çekilsin mi?`}
        description="Toplanan destekler silinir; öneri yeniden açılamaz."
        confirmLabel="Geri Çek"
        tone="danger"
        loading={withdrawProposalMutation.isPending}
        error={
          withdrawProposalMutation.isError
            ? formationActionError(withdrawProposalMutation.error, "Geri çekilemedi.")
            : null
        }
        onConfirm={() => withdrawProposalMutation.mutate()}
        onClose={() => {
          setWithdrawOpen(false);
          withdrawProposalMutation.reset();
        }}
      />
    </div>
  );
}
