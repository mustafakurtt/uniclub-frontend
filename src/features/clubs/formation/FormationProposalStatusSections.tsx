import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMyClubApplication } from "@/features/clubs/api/clubs";
import ClubApplicationApprovalChain from "@/features/admin/components/ClubApplicationApprovalChain";
import FormationProposalProgress from "@/features/clubs/formation/FormationProposalProgress";
import {
  formationDaysRemaining,
  formationDaysRemainingLabel,
} from "@/features/clubs/formation/formationProposalLabels";
import { getStudentApplicationStatusLine } from "@/features/clubs/applicationStatus";
import { Icon } from "@/shared/ui/Icon";
import type { FormationProposalDetail } from "@/shared/types";

interface Props {
  proposal: FormationProposalDetail;
}

export default function FormationProposalSubmittedSection({ proposal }: Props) {
  const applicationQuery = useQuery({
    queryKey: ["club-application", proposal.applicationId],
    queryFn: () => getMyClubApplication(proposal.applicationId!),
    enabled: Boolean(proposal.applicationId),
  });

  const application = applicationQuery.data;

  return (
    <section className="card border-green-100 bg-green-50/40 p-5 space-y-4">
      <div>
        <h2 className="font-display text-base font-bold text-slate-900">Başvuruya dönüştü</h2>
        <p className="mt-1 text-sm text-slate-600">
          Yeterli destek toplandı; kulüp kurma başvurun resmi onay zincirine aktarıldı.
        </p>
      </div>

      {applicationQuery.isLoading && (
        <div className="skeleton h-16 w-full" />
      )}

      {application && (
        <>
          <div className="rounded-xl border border-green-100 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700">Başvuru durumu</p>
            <p className="mt-1 font-semibold text-slate-900">
              {getStudentApplicationStatusLine(application)}
            </p>
          </div>
          <ClubApplicationApprovalChain approvals={application.approvals} showAllSteps />
          <Link
            to={`/applications/${proposal.applicationId}`}
            className="btn-secondary inline-flex text-sm"
          >
            Başvuru detayına git <Icon name="arrowRight" size={14} />
          </Link>
        </>
      )}
    </section>
  );
}

interface CollectingSectionProps {
  proposal: FormationProposalDetail;
}

export function FormationProposalCollectingSection({ proposal }: CollectingSectionProps) {
  const remaining = Math.max(0, proposal.supportThreshold - proposal.supportCount);
  const daysLeft = formationDaysRemaining(proposal.expiresAt);

  return (
    <section className="card p-5 space-y-4">
      <div>
        <h2 className="font-display text-base font-bold text-slate-900">Destek toplama</h2>
        <p className="mt-1 text-sm text-slate-500">
          {remaining > 0
            ? `Başvuruya dönüşmesi için ${remaining} destek daha gerekiyor.`
            : "Eşik tamamlandı — başvuru oluşturuluyor."}
        </p>
      </div>
      {proposal.supportThreshold > 0 && (
        <FormationProposalProgress
          supportCount={proposal.supportCount}
          supportThreshold={proposal.supportThreshold}
        />
      )}
      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="chip">
          Süre: {daysLeft === 0 ? "bugün son gün" : formationDaysRemainingLabel(proposal.expiresAt)}
        </span>
        <span className="chip">
          Bitiş: {new Date(proposal.expiresAt).toLocaleDateString("tr-TR")}
        </span>
      </div>
    </section>
  );
}
