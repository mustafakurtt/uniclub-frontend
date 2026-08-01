import { Link } from "react-router-dom";
import { formatApplicationWaitingSince } from "@/features/admin/committeePendingDisplay";
import { Icon } from "@/shared/ui/Icon";
import type { MyCommitteePendingApplication } from "@/shared/types";

interface CommitteePendingApplicationsListProps {
  items: MyCommitteePendingApplication[];
}

export default function CommitteePendingApplicationsList({
  items,
}: CommitteePendingApplicationsListProps) {
  return (
    <ul className="divide-y divide-violet-100 rounded-2xl border border-violet-100 bg-white">
      {items.map((application) => {
        const applicantName = application.applicant
          ? `${application.applicant.firstName} ${application.applicant.lastName}`
          : "Başvuran bilgisi yok";

        return (
          <li key={application.id}>
            <Link
              to={`/admin/applications/${application.id}?from=committee-tasks`}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-violet-50/60"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {application.proposedName}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{applicantName}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {application.committeeName} · Kademe {application.committeeStep} ·{" "}
                  {formatApplicationWaitingSince(application.createdAt)}
                </p>
              </div>
              <Icon name="chevronRight" size={16} className="shrink-0 text-slate-300" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
