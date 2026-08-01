import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import EmptyState from "@/shared/ui/EmptyState";
import PageLoader from "@/shared/ui/PageLoader";
import { Icon } from "@/shared/ui/Icon";
import FormationProposalCard from "@/features/clubs/formation/FormationProposalCard";
import {
  getFormationProposals,
  supportFormationProposal,
  withdrawFormationSupport,
} from "@/features/clubs/api/formationProposals";
import { getErrorMessage, getErrorCode } from "@/shared/api/client";

const FORMATION_ERROR_HINTS: Record<string, string> = {
  "club.cannotSupportOwnProposal": "Kendi önerinize destek veremezsiniz.",
  "club.formationAlreadySupported": "Bu öneriyi zaten desteklediniz.",
  "club.formationSupportNotFound": "Aktif bir destek kaydınız bulunmuyor.",
  "club.formationSupportDisabled": "Bu kurumda dijital destek toplama kapalı.",
};

function formationActionError(error: unknown, fallback: string): string {
  const code = getErrorCode(error);
  if (code && FORMATION_ERROR_HINTS[code]) return FORMATION_ERROR_HINTS[code];
  return getErrorMessage(error, fallback);
}

export default function FormationProposalsPage() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const proposalsQuery = useQuery({
    queryKey: ["formation-proposals"],
    queryFn: getFormationProposals,
  });

  const supportMutation = useMutation({
    mutationFn: (proposalId: string) => supportFormationProposal(proposalId),
    onMutate: (id) => {
      setActiveId(id);
      setActionError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formation-proposals"] });
      setActiveId(null);
    },
    onError: (error) => {
      setActionError(formationActionError(error, "Destek kaydedilemedi."));
      setActiveId(null);
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (proposalId: string) => withdrawFormationSupport(proposalId),
    onMutate: (id) => {
      setActiveId(id);
      setActionError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formation-proposals"] });
      setActiveId(null);
    },
    onError: (error) => {
      setActionError(formationActionError(error, "Destek geri çekilemedi."));
      setActiveId(null);
    },
  });

  if (proposalsQuery.isLoading) {
    return <PageLoader label="Kuruluş önerileri yükleniyor…" />;
  }

  if (proposalsQuery.isError) {
    return (
      <div className="alert-error">
        {getErrorMessage(proposalsQuery.error, "Öneriler yüklenemedi.")}
      </div>
    );
  }

  const proposals = proposalsQuery.data ?? [];
  const featureDisabled =
    proposals.length === 0 &&
    proposalsQuery.isSuccess &&
    !proposalsQuery.isFetching;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900">
            Kuruluş <span className="text-gradient">Önerileri</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kampüste yeni bir kulüp için dijital destek topla — ıslak imza yok.
          </p>
        </div>
        <Link to="/clubs/new" className="btn-primary text-sm">
          <Icon name="add" size={16} /> Kulüp Kur
        </Link>
      </div>

      {proposals.length === 0 ? (
        <EmptyState
          icon="seedling"
          title={
            featureDisabled
              ? "Bu kurumda kuruluş önerisi kapalı"
              : "Açık kuruluş önerisi yok"
          }
          description={
            featureDisabled
              ? "Üniversiteniz doğrudan başvuru modelini kullanıyor veya henüz açık öneri bulunmuyor."
              : "İlk öneriyi sen açabilirsin — Kulüp Kur ile başla."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {proposals.map((proposal) => (
            <FormationProposalCard
              key={proposal.id}
              proposal={proposal}
              actionPending={activeId === proposal.id && (supportMutation.isPending || withdrawMutation.isPending)}
              actionError={activeId === proposal.id ? actionError : null}
              onSupport={() => supportMutation.mutate(proposal.id)}
              onWithdrawSupport={() => withdrawMutation.mutate(proposal.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
