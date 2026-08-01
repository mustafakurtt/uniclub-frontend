import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminClubsListHref } from "@/features/admin/adminListNav";
import { getApplicationDecisionState } from "@/features/admin/approvalChain";
import ClubApplicationApprovalChain from "@/features/admin/components/ClubApplicationApprovalChain";
import ClubApplicationAppealReviewSection from "@/features/admin/components/ClubApplicationAppealReviewSection";
import ClubApplicationChecklistSection from "@/features/admin/components/ClubApplicationChecklistSection";
import ClubApplicationDecisionPanel from "@/features/admin/components/ClubApplicationDecisionPanel";
import ClubApplicationEventTimeline from "@/features/admin/components/ClubApplicationEventTimeline";
import RequireUniversity from "@/features/admin/components/RequireUniversity";
import {
  getClubApplication,
  getClubApplicationHistory,
} from "@/features/admin/api";
import { approverRoleLabel } from "@/features/admin/labels";
import {
  APPLICATION_STATUS_CHIP,
  APPLICATION_STATUS_LABELS,
} from "@/features/clubs/applicationLabels";
import RequirePermission from "@/features/auth/guards/RequirePermission";
import { useAuth } from "@/features/auth/hooks/useAuth";
import Forbidden from "@/features/auth/pages/Forbidden";
import { getErrorMessage } from "@/shared/api/client";
import PageLoader from "@/shared/ui/PageLoader";
import { Icon } from "@/shared/ui/Icon";

function ApplicationDetailBody({
  universityId,
  applicationId,
}: {
  universityId: string;
  applicationId: string;
}) {
  const [searchParams] = useSearchParams();
  const { roleNames, hasPermission } = useAuth();
  const hasClubApprove = hasPermission("club.approve");
  const backHref = adminClubsListHref({
    from: searchParams.get("from"),
    status: searchParams.get("status"),
  });

  const detailQuery = useQuery({
    queryKey: ["admin", universityId, "club-application", applicationId],
    queryFn: () => getClubApplication(universityId, applicationId),
  });

  const historyQuery = useQuery({
    queryKey: ["admin", universityId, "club-application-history", applicationId],
    queryFn: () => getClubApplicationHistory(universityId, applicationId),
  });

  if (detailQuery.isLoading) {
    return <PageLoader label="Başvuru yükleniyor…" />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="card p-8 text-center">
        <Icon name="notFound" size={40} className="mx-auto mb-3 text-slate-400" />
        <p className="font-semibold text-slate-700">Başvuru bulunamadı.</p>
        <Link to={backHref} className="btn-ghost mt-4 inline-flex">
          Listeye dön
        </Link>
      </div>
    );
  }

  const application = detailQuery.data;
  const decisionState =
    application.status === "pending"
      ? getApplicationDecisionState(application.approvals, roleNames, hasClubApprove)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <Link to={backHref} className="btn-ghost mb-4 px-0 text-sm">
          <Icon name="arrowLeft" size={14} /> Kulüp başvurularına dön
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-extrabold text-slate-900">
            {application.proposedName}
          </h1>
          <span className={`chip ${APPLICATION_STATUS_CHIP[application.status]}`}>
            {APPLICATION_STATUS_LABELS[application.status]}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Başvuru tarihi: {new Date(application.createdAt).toLocaleString("tr-TR")}
          {application.updatedAt !== application.createdAt && (
            <> · Son güncelleme: {new Date(application.updatedAt).toLocaleString("tr-TR")}</>
          )}
        </p>
      </div>

      <section className="card p-5">
        <h2 className="font-display text-base font-bold text-slate-900">Başvuran</h2>
        {application.applicant ? (
          <p className="mt-2 text-sm text-slate-700">
            <strong>
              {application.applicant.firstName} {application.applicant.lastName}
            </strong>
            <span className="text-slate-500"> · {application.applicant.email}</span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-400">Başvuran bilgisi yok.</p>
        )}
        {application.description ? (
          <p className="mt-4 text-sm text-slate-600 whitespace-pre-wrap">{application.description}</p>
        ) : (
          <p className="mt-4 text-sm italic text-slate-400">Açıklama eklenmemiş.</p>
        )}
      </section>

      {application.revisionRequest && (
        <section className="card border-violet-100 bg-violet-50/50 p-5">
          <h2 className="font-display text-base font-bold text-slate-900">Açık revizyon talebi</h2>
          <p className="mt-1 text-xs text-slate-500">
            Kademe {application.revisionRequest.step} ·{" "}
            {approverRoleLabel(
              application.approvals.find((a) => a.step === application.revisionRequest?.step)
                ?.approverRole ?? ""
            )}{" "}
            · {new Date(application.revisionRequest.requestedAt).toLocaleString("tr-TR")}
          </p>
          {application.revisionRequest.requestedBy && (
            <p className="mt-1 text-xs text-slate-500">
              Talep eden: {application.revisionRequest.requestedBy.firstName}{" "}
              {application.revisionRequest.requestedBy.lastName}
            </p>
          )}
          <blockquote className="mt-3 rounded-xl border border-violet-100 bg-white px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap">
            {application.revisionRequest.note}
          </blockquote>
        </section>
      )}

      {application.approvals.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-3 font-display text-base font-bold text-slate-900">Onay zinciri</h2>
          <ClubApplicationApprovalChain approvals={application.approvals} showAllSteps />
        </section>
      )}

      <ClubApplicationChecklistSection
        universityId={universityId}
        applicationId={applicationId}
        applicationStatus={application.status}
      />

      <ClubApplicationDecisionPanel
        universityId={universityId}
        application={application}
        decisionState={decisionState}
      />

      {(application.appeal || application.status === "rejected") && historyQuery.data && (
        <ClubApplicationAppealReviewSection
          universityId={universityId}
          application={application}
          historyEvents={historyQuery.data.events}
        />
      )}

      <section className="card p-5">
        <h2 className="mb-1 font-display text-base font-bold text-slate-900">Olay geçmişi</h2>
        <p className="mb-4 text-sm text-slate-500">
          Kim, hangi kademede, ne zaman karar verdi — kronolojik denetim izi.
        </p>
        {historyQuery.isLoading ? (
          <div className="space-y-3">
            <div className="skeleton h-16 w-full" />
            <div className="skeleton h-16 w-full" />
          </div>
        ) : historyQuery.isError ? (
          <div className="alert-error">
            {getErrorMessage(historyQuery.error, "Geçmiş yüklenemedi.")}
          </div>
        ) : historyQuery.data ? (
          <ClubApplicationEventTimeline history={historyQuery.data} />
        ) : null}
      </section>
    </div>
  );
}

export default function AdminClubApplicationDetail() {
  const { applicationId } = useParams<{ applicationId: string }>();

  if (!applicationId) {
    return <div className="alert-error">Geçersiz başvuru bağlantısı.</div>;
  }

  return (
    <RequirePermission permission="application.view" fallback={<Forbidden />}>
      <RequireUniversity>
        {(universityId) => (
          <ApplicationDetailBody universityId={universityId} applicationId={applicationId} />
        )}
      </RequireUniversity>
    </RequirePermission>
  );
}
