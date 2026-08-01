import { Link, useParams, useSearchParams } from "react-router-dom";
import { adminUsersListHref } from "@/features/admin/adminListNav";
import UserDetailContent from "@/features/admin/components/user-detail/UserDetailContent";
import { useUserDetailQuery } from "@/features/admin/components/user-detail/useUserDetail";
import RequireUniversity from "@/features/admin/components/RequireUniversity";
import RequirePermission from "@/features/auth/guards/RequirePermission";
import Forbidden from "@/features/auth/pages/Forbidden";
import PageLoader from "@/shared/ui/PageLoader";
import { Icon } from "@/shared/ui/Icon";

function UserDetailBody({ universityId, userId }: { universityId: string; userId: string }) {
  const [searchParams] = useSearchParams();
  const backHref = adminUsersListHref({
    status: searchParams.get("status"),
    role: searchParams.get("role"),
  });

  const detailQuery = useUserDetailQuery(universityId, userId, true);

  if (detailQuery.isLoading) {
    return <PageLoader label="Kullanıcı yükleniyor…" />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="card p-8 text-center">
        <Icon name="notFound" size={40} className="mx-auto mb-3 text-slate-400" />
        <p className="font-semibold text-slate-700">Kullanıcı bulunamadı.</p>
        <Link to={backHref} className="btn-ghost mt-4 inline-flex">
          Listeye dön
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to={backHref} className="btn-ghost mb-4 px-0 text-sm">
          <Icon name="arrowLeft" size={14} /> Kullanıcı listesine dön
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Kullanıcı detayı</h1>
        <p className="mt-1 text-sm text-slate-500">
          Durum, roller, kulüp üyelikleri ve etkin yetkiler.
        </p>
      </div>
      <UserDetailContent universityId={universityId} user={detailQuery.data} />
    </div>
  );
}

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();

  if (!userId) {
    return <div className="alert-error">Geçersiz kullanıcı bağlantısı.</div>;
  }

  return (
    <RequirePermission permission="user.view" fallback={<Forbidden />}>
      <RequireUniversity>
        {(universityId) => <UserDetailBody universityId={universityId} userId={userId} />}
      </RequireUniversity>
    </RequirePermission>
  );
}
