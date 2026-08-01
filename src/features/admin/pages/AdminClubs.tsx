import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import ClubApplicationsSection from "@/features/admin/components/ClubApplicationsSection";
import FormationProposalsSection from "@/features/admin/components/FormationProposalsSection";
import AdminClubsSection from "@/features/admin/components/AdminClubsSection";
import RequireUniversity from "@/features/admin/components/RequireUniversity";
import type { ApplicationStatus } from "@/shared/types";
import type { FormationProposalStatus } from "@/shared/types";

type AdminClubsTab = "applications" | "formation";

const APPLICATION_STATUSES = new Set<ApplicationStatus | "all">([
  "pending",
  "revision_requested",
  "approved",
  "rejected",
  "all",
]);

const PROPOSAL_STATUSES = new Set<FormationProposalStatus | "all">([
  "collecting_support",
  "submitted",
  "expired",
  "all",
]);

function parseTab(value: string | null): AdminClubsTab {
  return value === "formation" ? "formation" : "applications";
}

function parseApplicationStatus(value: string | null): ApplicationStatus | "all" {
  if (value && APPLICATION_STATUSES.has(value as ApplicationStatus | "all")) {
    return value as ApplicationStatus | "all";
  }
  return "pending";
}

function parseProposalStatus(value: string | null): FormationProposalStatus | "all" {
  if (value && PROPOSAL_STATUSES.has(value as FormationProposalStatus | "all")) {
    return value as FormationProposalStatus | "all";
  }
  return "collecting_support";
}

export default function AdminClubs() {
  const { hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = parseTab(searchParams.get("tab"));
  const applicationStatus = parseApplicationStatus(searchParams.get("status"));
  const proposalStatus = parseProposalStatus(searchParams.get("status"));

  const canViewApplications = hasPermission("application.view");
  const canViewClubs = hasPermission("club.view");

  const setTab = useCallback(
    (next: AdminClubsTab) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set("tab", next);
        if (next === "formation" && !params.get("status")) {
          params.set("status", "collecting_support");
        }
        if (next === "applications" && !params.get("status")) {
          params.set("status", "pending");
        }
        return params;
      });
    },
    [setSearchParams]
  );

  const setApplicationStatus = useCallback(
    (status: ApplicationStatus | "all") => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set("tab", "applications");
        params.set("status", status);
        return params;
      });
    },
    [setSearchParams]
  );

  const setProposalStatus = useCallback(
    (status: FormationProposalStatus | "all") => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set("tab", "formation");
        params.set("status", status);
        return params;
      });
    },
    [setSearchParams]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Kulüp Yönetimi</h1>
        <p className="mt-1 text-sm text-slate-500">
          Başvuruları değerlendir, kuruluş önerilerini izle, kulüp durumlarını yönet.
        </p>
      </div>

      {!canViewApplications && !canViewClubs ? (
        <div className="alert-error">Bu bölüm için kulüp görüntüleme yetkin bulunmuyor.</div>
      ) : (
        <RequireUniversity>
          {(universityId) => (
            <div className="space-y-6">
              {canViewApplications && (
                <>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setTab("applications")}
                      className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                        tab === "applications"
                          ? "bg-brand-600 text-white shadow-glow"
                          : "bg-white text-slate-500 border border-slate-200"
                      }`}
                    >
                      Kulüp Başvuruları
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab("formation")}
                      className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                        tab === "formation"
                          ? "bg-brand-600 text-white shadow-glow"
                          : "bg-white text-slate-500 border border-slate-200"
                      }`}
                    >
                      Kuruluş Önerileri
                    </button>
                  </div>

                  {tab === "applications" ? (
                    <ClubApplicationsSection
                      universityId={universityId}
                      statusFilter={applicationStatus}
                      onStatusFilterChange={setApplicationStatus}
                    />
                  ) : (
                    <FormationProposalsSection
                      universityId={universityId}
                      statusFilter={proposalStatus}
                      onStatusFilterChange={setProposalStatus}
                    />
                  )}
                </>
              )}

              {canViewClubs && <AdminClubsSection universityId={universityId} />}
            </div>
          )}
        </RequireUniversity>
      )}
    </div>
  );
}
