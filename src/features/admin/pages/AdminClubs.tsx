import { useAuth } from "@/features/auth/hooks/useAuth";
import ClubApplicationsSection from "@/features/admin/components/ClubApplicationsSection";
import AdminClubsSection from "@/features/admin/components/AdminClubsSection";
import RequireUniversity from "@/features/admin/components/RequireUniversity";

// Kulüp yönetimi (docs/FRONTEND_YONETIM.md §5.2/§5.3) — seçili üniversite
// üzerinde çalışır (tenantScoped). Hedef tenant kullanıcıdan değil
// AdminScope'tan gelir: platform hesabında user.universityId null'dır
// (FRONTEND_RUTBE_VE_PLATFORM.md §1/§2).
//
// Okuma ve aksiyon yetkileri ayrıdır → salt-okunur roller (auditor) de görür:
//  • başvurular  → görüntüleme `application.view`, karar `club.approve`
//  • kulüpler    → görüntüleme `club.view`, durum/profil `club.update`,
//                  danışman `club.advisor.manage`, silme `club.delete`
// Bölüm içindeki aksiyon butonları ilgili yetkiye göre gizlenir.
export default function AdminClubs() {
  const { hasPermission } = useAuth();

  const canViewApplications = hasPermission("application.view");
  const canViewClubs = hasPermission("club.view");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Kulüp Yönetimi</h1>
        <p className="mt-1 text-sm text-slate-500">
          Başvuruları değerlendir, kulüp durumlarını ve danışmanlarını yönet.
        </p>
      </div>

      {!canViewApplications && !canViewClubs ? (
        <div className="alert-error">Bu bölüm için kulüp görüntüleme yetkin bulunmuyor.</div>
      ) : (
        <RequireUniversity>
          {(universityId) => (
            <div className="space-y-6">
              {canViewApplications && <ClubApplicationsSection universityId={universityId} />}
              {canViewClubs && <AdminClubsSection universityId={universityId} />}
            </div>
          )}
        </RequireUniversity>
      )}
    </div>
  );
}
