import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Modal from "@/shared/ui/Modal";
import FormationProposalProgress from "@/features/clubs/formation/FormationProposalProgress";
import {
  FORMATION_PROPOSAL_STATUS_CHIP,
  FORMATION_PROPOSAL_STATUS_LABELS,
} from "@/features/clubs/formation/formationProposalLabels";
import { getAdminFormationProposal } from "@/features/admin/api";
import { getErrorMessage } from "@/shared/api/client";

interface AdminFormationProposalDetailModalProps {
  universityId: string;
  proposalId: string;
  onClose: () => void;
}

export default function AdminFormationProposalDetailModal({
  universityId,
  proposalId,
  onClose,
}: AdminFormationProposalDetailModalProps) {
  const detailQuery = useQuery({
    queryKey: ["admin", universityId, "formation-proposal", proposalId],
    queryFn: () => getAdminFormationProposal(universityId, proposalId),
  });

  const proposal = detailQuery.data;

  return (
    <Modal
      open
      onClose={onClose}
      title={proposal?.proposedName ?? "Kuruluş önerisi"}
      description="Denetim görünümü — destekçi kimlikleri yalnızca SKS'de görünür."
      size="lg"
      footer={
        <button type="button" className="btn-primary" onClick={onClose}>
          Kapat
        </button>
      }
    >
      {detailQuery.isLoading ? (
        <div className="skeleton h-32 w-full" />
      ) : detailQuery.isError ? (
        <div className="alert-error">{getErrorMessage(detailQuery.error, "Detay yüklenemedi.")}</div>
      ) : proposal ? (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className={`chip text-xs ${FORMATION_PROPOSAL_STATUS_CHIP[proposal.status]}`}>
              {FORMATION_PROPOSAL_STATUS_LABELS[proposal.status]}
            </span>
            {proposal.applicationId && (
              <Link
                to={`/admin/clubs`}
                className="chip text-xs bg-green-50 text-green-700 border-green-100"
                onClick={onClose}
              >
                Başvuru oluştu
              </Link>
            )}
          </div>

          {proposal.proposer && (
            <p className="text-sm text-slate-600">
              Öneren:{" "}
              <strong>
                {proposal.proposer.firstName} {proposal.proposer.lastName}
              </strong>{" "}
              ({proposal.proposer.email})
            </p>
          )}

          {proposal.description && (
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{proposal.description}</p>
          )}

          {proposal.supportThreshold > 0 && (
            <FormationProposalProgress
              supportCount={proposal.supportCount}
              supportThreshold={proposal.supportThreshold}
            />
          )}

          <div>
            <h3 className="mb-2 font-display text-sm font-bold text-slate-900">
              Destekçiler ({proposal.supporters.length})
            </h3>
            {proposal.supporters.length === 0 ? (
              <p className="text-sm text-slate-500">Henüz destekçi yok.</p>
            ) : (
              <ul className="max-h-60 space-y-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                {proposal.supporters.map((row) => (
                  <li
                    key={`${row.user.id}-${row.supportedAt}`}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <span className="font-semibold text-slate-800">
                      {row.user.firstName} {row.user.lastName}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(row.supportedAt).toLocaleString("tr-TR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <dl className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
            <div>
              <dt className="font-bold uppercase tracking-wide">Oluşturulma</dt>
              <dd>{new Date(proposal.createdAt).toLocaleString("tr-TR")}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wide">Son tarih</dt>
              <dd>{new Date(proposal.expiresAt).toLocaleString("tr-TR")}</dd>
            </div>
            {proposal.submittedAt && (
              <div>
                <dt className="font-bold uppercase tracking-wide">SKS'ye düşüş</dt>
                <dd>{new Date(proposal.submittedAt).toLocaleString("tr-TR")}</dd>
              </div>
            )}
          </dl>
        </div>
      ) : null}
    </Modal>
  );
}
