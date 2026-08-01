import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMyApplications } from "@/features/auth/api/users";
import { getFormationProposals } from "@/features/clubs/api/formationProposals";
import {
  APPLICATION_STATUS_CHIP,
  APPLICATION_STATUS_LABELS,
} from "@/features/clubs/applicationLabels";
import {
  getStudentApplicationStatusLine,
  isOpenClubApplication,
} from "@/features/clubs/applicationStatus";
import {
  FORMATION_PROPOSAL_STATUS_CHIP,
  FORMATION_PROPOSAL_STATUS_LABELS,
  formationDaysRemainingLabel,
} from "@/features/clubs/formation/formationProposalLabels";
import { getMyClubApplication } from "@/features/clubs/api/clubs";
import Reveal from "@/shared/ui/Reveal";
import { Icon } from "@/shared/ui/Icon";
import type { ClubApplication, FormationProposal } from "@/shared/types";

function ApplicationProcessCard({ application }: { application: ClubApplication }) {
  const detailQuery = useQuery({
    queryKey: ["club-application", application.id],
    queryFn: () => getMyClubApplication(application.id),
  });

  const statusLine = detailQuery.data
    ? getStudentApplicationStatusLine(detailQuery.data)
    : APPLICATION_STATUS_LABELS[application.status];

  return (
    <Link
      to={`/applications/${application.id}`}
      className="card-hover flex items-start gap-4 p-5 transition-all"
    >
      <span className="icon-tile shrink-0">
        <Icon name="seedling" size={22} className="text-brand-600" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display font-bold text-slate-900 truncate">{application.proposedName}</p>
          <span className={`chip text-[10px] ${APPLICATION_STATUS_CHIP[application.status]}`}>
            {APPLICATION_STATUS_LABELS[application.status]}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600">{statusLine}</p>
        <p className="mt-2 text-xs font-semibold text-brand-600">Detayı gör →</p>
      </div>
    </Link>
  );
}

function ProposalProcessCard({ proposal }: { proposal: FormationProposal }) {
  const remaining = Math.max(0, proposal.supportThreshold - proposal.supportCount);

  return (
    <Link
      to={`/clubs/proposals/${proposal.id}`}
      className="card-hover flex items-start gap-4 p-5 transition-all"
    >
      <span className="icon-tile shrink-0">
        <Icon name="handshake" size={22} className="text-accent-500" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display font-bold text-slate-900 truncate">{proposal.proposedName}</p>
          <span className={`chip text-[10px] ${FORMATION_PROPOSAL_STATUS_CHIP[proposal.status]}`}>
            {FORMATION_PROPOSAL_STATUS_LABELS[proposal.status]}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {remaining > 0
            ? `${remaining} destek daha · ${formationDaysRemainingLabel(proposal.expiresAt)}`
            : "Eşik tamamlandı — başvuru aşamasında"}
        </p>
        <p className="mt-2 text-xs font-semibold text-brand-600">Öneri detayı →</p>
      </div>
    </Link>
  );
}

interface Props {
  userId: string;
}

export default function ActiveProcessesCard({ userId }: Props) {
  const applicationsQuery = useQuery({
    queryKey: ["my-applications"],
    queryFn: getMyApplications,
  });

  const proposalsQuery = useQuery({
    queryKey: ["formation-proposals"],
    queryFn: getFormationProposals,
  });

  const openApplications = (applicationsQuery.data ?? []).filter(isOpenClubApplication);

  const myCollectingProposal = (proposalsQuery.data ?? []).find(
    (p) => p.status === "collecting_support" && p.proposer?.id === userId
  );

  const hasItems = openApplications.length > 0 || Boolean(myCollectingProposal);

  if (applicationsQuery.isLoading || proposalsQuery.isLoading || !hasItems) {
    return null;
  }

  return (
    <Reveal>
      <section className="space-y-3">
        <div>
          <span className="badge mb-2">Takip et</span>
          <h2 className="font-display text-xl font-extrabold text-slate-900">Açık süreçlerin</h2>
          <p className="mt-1 text-sm text-slate-500">
            Kulüp kurma başvurun veya önerin burada — durumu tek tıkla kontrol et.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {openApplications.map((app) => (
            <ApplicationProcessCard key={app.id} application={app} />
          ))}
          {myCollectingProposal && <ProposalProcessCard proposal={myCollectingProposal} />}
        </div>
      </section>
    </Reveal>
  );
}
