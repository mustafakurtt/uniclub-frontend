import { Link } from "react-router-dom";
import { Icon } from "@/shared/ui/Icon";
import { adminDetailQuery } from "@/features/admin/adminListNav";
import type { AdminClubApplication } from "@/features/admin/api";
import ClubApplicationApprovalChain from "@/features/admin/components/ClubApplicationApprovalChain";
import {
  APPLICATION_STATUS_CHIP,
  APPLICATION_STATUS_LABELS,
} from "@/features/clubs/applicationLabels";
import type { ApplicationStatus } from "@/shared/types";

interface ClubApplicationListItemProps {
  application: AdminClubApplication;
  statusFilter: ApplicationStatus | "all";
}

export default function ClubApplicationListItem({
  application,
  statusFilter,
}: ClubApplicationListItemProps) {
  const app = application;
  const detailHref = `/admin/applications/${app.id}${adminDetailQuery("applications", statusFilter)}`;

  return (
    <li>
      <Link
        to={detailHref}
        className="flex flex-wrap items-start justify-between gap-3 py-3 transition-colors hover:bg-slate-50/80 -mx-2 px-2 rounded-xl"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-display text-sm font-bold text-slate-900">{app.proposedName}</p>
            {app.status !== "pending" && (
              <span className={`chip text-[10px] ${APPLICATION_STATUS_CHIP[app.status]}`}>
                {APPLICATION_STATUS_LABELS[app.status]}
              </span>
            )}
          </div>
          {app.description && (
            <p className="mt-0.5 line-clamp-2 max-w-xl text-xs text-slate-500">{app.description}</p>
          )}
          <p className="mt-1 text-[11px] font-semibold text-slate-400">
            {app.applicant ? `${app.applicant.firstName} ${app.applicant.lastName} · ` : ""}
            {new Date(app.createdAt).toLocaleDateString("tr-TR")}
          </p>
          {app.approvals && <ClubApplicationApprovalChain approvals={app.approvals} />}
        </div>

        <Icon name="chevronRight" size={18} className="shrink-0 text-slate-300" />
      </Link>
    </li>
  );
}
