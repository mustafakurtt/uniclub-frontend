import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminClubsListHref } from "@/features/admin/adminListNav";
import FormationProposalProgress from "@/features/clubs/formation/FormationProposalProgress";
import {
  FORMATION_PROPOSAL_STATUS_CHIP,
  FORMATION_PROPOSAL_STATUS_LABELS,
} from "@/features/clubs/formation/formationProposalLabels";
import RequireUniversity from "@/features/admin/components/RequireUniversity";
import { getAdminFormationProposal } from "@/features/admin/api";
import RequirePermission from "@/features/auth/guards/RequirePermission";
import Forbidden from "@/features/auth/pages/Forbidden";
import PageLoader from "@/shared/ui/PageLoader";
import { Icon } from "@/shared/ui/Icon";

function ProposalDetailBody({
  universityId,
  proposalId,
}: {
  universityId: string;
  proposalId: string;
}) {
  const [searchParams] = useSearchParams();
  const backHref = adminClubsListHref({
    from: searchParams.get("from"),
    status: searchParams.get("status"),
  });

  const detailQuery = useQuery({
    queryKey: ["admin", universityId, "formation-proposal", proposalId],
    queryFn: () => getAdminFormationProposal(universityId, proposalId),
  });

  if (detailQuery.isLoading) {
    return <PageLoader label="Kuruluş önerisi yükleniyor…" />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="card p-8 text-center">
        <Icon name="notFound" size={40} className="mx-auto mb-3 text-slate-400" />
        <p className="font-semibold text-slate-700">Kuruluş önerisi bulunamadı.</p>
        <Link to={backHref} className="btn-ghost mt-4 inline-flex">
          Listeye dön
        </Link>
      </div>
    );
  }

  const proposal = detailQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <Link to={backHref} className="btn-ghost mb-4 px-0 text-sm">
          <Icon name="arrowLeft" size={14} /> Kuruluş önerilerine dön
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-extrabold text-slate-900">
            {proposal.proposedName}
          </h1>
          <span className={`chip ${FORMATION_PROPOSAL_STATUS_CHIP[proposal.status]}`}>
            {FORMATION_PROPOSAL_STATUS_LABELS[proposal.status]}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Destekçi kimlikleri yalnızca SKS denetim görünümünde listelenir (KVKK).
        </p>
      </div>

      <section className="card space-y-4 p-5">
        {proposal.proposer && (
          <div>
            <h2 className="font-display text-sm font-bold text-slate-900">Öneren</h2>
            <p className="mt-1 text-sm text-slate-700">
              <strong>
                {proposal.proposer.firstName} {proposal.proposer.lastName}
              </strong>
              <span className="text-slate-500"> · {proposal.proposer.email}</span>
            </p>
          </div>
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

        {proposal.applicationId && (
          <Link
            to={`/admin/applications/${proposal.applicationId}`}
            className="chip inline-flex text-xs bg-green-50 text-green-700 border-green-100"
          >
            Başvuruya dönüştü — başvuruyu aç
          </Link>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-display text-base font-bold text-slate-900">
          Destekçiler ({proposal.supporters.length})
        </h2>
        {proposal.supporters.length === 0 ? (
          <p className="text-sm text-slate-500">Henüz destekçi yok.</p>
        ) : (
          <ul className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/60 p-3">
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
      </section>

      <section className="card p-5">
        <dl className="grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Oluşturulma
            </dt>
            <dd className="mt-1">{new Date(proposal.createdAt).toLocaleString("tr-TR")}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Son tarih
            </dt>
            <dd className="mt-1">{new Date(proposal.expiresAt).toLocaleString("tr-TR")}</dd>
          </div>
          {proposal.submittedAt && (
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                SKS&apos;ye düşüş
              </dt>
              <dd className="mt-1">{new Date(proposal.submittedAt).toLocaleString("tr-TR")}</dd>
            </div>
          )}
        </dl>
      </section>
    </div>
  );
}

export default function AdminFormationProposalDetail() {
  const { proposalId } = useParams<{ proposalId: string }>();

  if (!proposalId) {
    return <div className="alert-error">Geçersiz öneri bağlantısı.</div>;
  }

  return (
    <RequirePermission permission="application.view" fallback={<Forbidden />}>
      <RequireUniversity>
        {(universityId) => (
          <ProposalDetailBody universityId={universityId} proposalId={proposalId} />
        )}
      </RequireUniversity>
    </RequirePermission>
  );
}
