import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import ClubApplicationsSection from "@/features/admin/components/ClubApplicationsSection";
import FormationProposalsSection from "@/features/admin/components/FormationProposalsSection";
import AdminClubsSection from "@/features/admin/components/AdminClubsSection";
import RequireUniversity from "@/features/admin/components/RequireUniversity";

type AdminClubsTab = "applications" | "formation";

export default function AdminClubs() {
  const { hasPermission } = useAuth();
  const [tab, setTab] = useState<AdminClubsTab>("applications");

  const canViewApplications = hasPermission("application.view");
  const canViewClubs = hasPermission("club.view");

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
                    <ClubApplicationsSection universityId={universityId} />
                  ) : (
                    <FormationProposalsSection universityId={universityId} />
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
