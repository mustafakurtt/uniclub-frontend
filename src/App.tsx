import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "@/pages/Landing";
import Register from "@/features/auth/pages/Register";
import Login from "@/features/auth/pages/Login";
import VerifyEmail from "@/features/auth/pages/VerifyEmail";
import Dashboard from "@/pages/Dashboard";
import Clubs from "@/features/clubs/pages/Clubs";
import ClubDetail from "@/features/clubs/pages/ClubDetail";
import ClubApplicationDetailPage from "@/features/clubs/pages/ClubApplicationDetailPage";
import FormationProposalsPage from "@/features/clubs/pages/FormationProposalsPage";
import FormationProposalDetailPage from "@/features/clubs/pages/FormationProposalDetailPage";
import CreateClubApplicationPage from "@/features/clubs/pages/CreateClubApplicationPage";
import Activities from "@/features/activities/pages/Activities";
import ActivityDetail from "@/features/activities/pages/ActivityDetail";
import ActivityCheckInPage from "@/features/activities/pages/ActivityCheckInPage";
import ActivityCheckInDisplayPage from "@/features/activities/pages/ActivityCheckInDisplayPage";
import Profile from "@/features/auth/pages/Profile";
import ProtectedRoute from "@/features/auth/guards/ProtectedRoute";
import RequireManagement from "@/features/auth/guards/RequireManagement";
import RequireTenantAccount from "@/features/auth/guards/RequireTenantAccount";
import MainLayout from "@/layouts/MainLayout";
import AdminLayout from "@/layouts/AdminLayout";
import AdminUniversities from "@/features/universities/pages/AdminUniversities";
import AdminUniversityDetail from "@/features/universities/pages/AdminUniversityDetail";
import AdminClubs from "@/features/admin/pages/AdminClubs";
import AdminModeration from "@/features/admin/pages/AdminModeration";
import AdminHome from "@/features/admin/pages/AdminHome";
import AdminUsers from "@/features/admin/pages/AdminUsers";
import AdminRoles from "@/features/admin/pages/AdminRoles";
import AdminPermissions from "@/features/admin/pages/AdminPermissions";
import AdminAudit from "@/features/admin/pages/AdminAudit";
import AdminSettings from "@/features/admin/pages/AdminSettings";
import Forbidden from "@/features/auth/pages/Forbidden";
import NotFound from "@/shared/pages/NotFound";
import PublicLayout from "@/layouts/PublicLayout";
import PublicClubPage from "@/features/public/pages/PublicClubPage";
import PublicActivityPage from "@/features/public/pages/PublicActivityPage";
import PublicQrResolvePage from "@/features/public/pages/PublicQrResolvePage";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen font-sans">
        <Routes>
          {/* Public: giriş yapmamış ziyaretçiler için vitrin */}
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          {/* E-postadaki doğrulama linki buraya iner (docs/FRONTEND_AUTH_RBAC.md §2.3) */}
          <Route path="/verify" element={<VerifyEmail />} />

          {/* Kamuya açık vitrin + afiş QR çözümleme (FRONTEND_KAMUYA_ACIK.md) */}
          <Route element={<PublicLayout />}>
            <Route path="/q/:code" element={<PublicQrResolvePage />} />
            <Route path="/u/:universitySlug/kulup/:clubSlug" element={<PublicClubPage />} />
            <Route path="/u/:universitySlug/etkinlik/:activityId" element={<PublicActivityPage />} />
          </Route>

          {/* Öğrenci self-service kabuğu. Tenant'sız platform hesapları (super_admin,
              platform_support) buraya giremez — backend 400 döner; RequireTenantAccount
              onları /admin'e yollar (FRONTEND_RUTBE_VE_PLATFORM.md §1). */}
          <Route
            element={
              <ProtectedRoute>
                <RequireTenantAccount>
                  <MainLayout />
                </RequireTenantAccount>
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/activities/:activityId" element={<ActivityDetail />} />
            <Route path="/activities/:activityId/yoklama" element={<ActivityCheckInPage />} />
            <Route
              path="/clubs/:clubId/activities/:activityId/yoklama-qr"
              element={<ActivityCheckInDisplayPage />}
            />
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/clubs/proposals" element={<FormationProposalsPage />} />
            <Route path="/clubs/proposals/:proposalId" element={<FormationProposalDetailPage />} />
            <Route path="/clubs/new" element={<CreateClubApplicationPage />} />
            {/* Detay id ile çalışır — backend'de slug lookup ucu yok (FRONTEND_CLUBS.md §5.1) */}
            <Route path="/clubs/:clubId" element={<ClubDetail />} />
            <Route path="/applications/:applicationId" element={<ClubApplicationDetailPage />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Yönetim paneli — ayrı kabuk (AdminLayout). Erişim rol adına değil,
              HERHANGİ bir yönetim yetkisine bağlıdır (RequireManagement). Bölüm
              içi sekme/butonlar ayrıca granüler yetkiye göre gösterilir/gizlenir
              (docs/FRONTEND_YONETIM.md §4/§7). */}
          <Route
            element={
              <ProtectedRoute>
                <RequireManagement fallback={<Forbidden />}>
                  <AdminLayout />
                </RequireManagement>
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminHome />} />
            {/* Kullanıcılar: liste + durum/bölüm + rol atama + effective yetki */}
            <Route path="/admin/users" element={<AdminUsers />} />
            {/* Kulüp yönetimi: başvurular + kulüpler + danışmanlar (granüler club.*) */}
            <Route path="/admin/clubs" element={<AdminClubs />} />
            {/* Üye & içerik moderasyonu: tenant üstten müdahale (club.member.manage,
                announcement.moderate, gallery.moderate) */}
            <Route path="/admin/moderation" element={<AdminModeration />} />
            {/* Akademik yapı: üniversite/domain/fakülte/bölüm */}
            <Route path="/admin/universities" element={<AdminUniversities />} />
            <Route path="/admin/universities/:universityId" element={<AdminUniversityDetail />} />
            {/* RBAC: roller (role.manage) + yetki kataloğu (permission.manage) */}
            <Route path="/admin/roles" element={<AdminRoles />} />
            <Route path="/admin/permissions" element={<AdminPermissions />} />
            {/* Denetim izi: korunan her yazma isteği (audit.view) */}
            <Route path="/admin/audit" element={<AdminAudit />} />
            {/* Tenant politika ayarları (university.settings.manage) */}
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
