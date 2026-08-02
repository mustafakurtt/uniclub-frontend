import RequireUniversity from "@/features/admin/components/RequireUniversity";
import RequirePermission from "@/features/auth/guards/RequirePermission";
import Forbidden from "@/features/auth/pages/Forbidden";
import AdminUniversityAnnouncementsBody from "@/features/university-announcements/pages/AdminUniversityAnnouncements";

export default function AdminUniversityAnnouncementsPage() {
  return (
    <RequirePermission permission="announcement.university.manage" fallback={<Forbidden />}>
      <RequireUniversity>
        {(universityId) => <AdminUniversityAnnouncementsBody universityId={universityId} />}
      </RequireUniversity>
    </RequirePermission>
  );
}
