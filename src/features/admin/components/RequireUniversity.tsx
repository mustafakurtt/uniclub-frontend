import type { ReactNode } from "react";
import { useAdminScope } from "@/features/admin/context/AdminScopeContext";
import { getErrorMessage } from "@/shared/api/client";
import EmptyState from "@/shared/ui/EmptyState";
import PageLoader from "@/shared/ui/PageLoader";

/**
 * Tenant'a bağlı yönetim sayfaları için kapsam guard'ı.
 * Seçili üniversite hazır olana kadar sayfayı çalıştırmaz — böylece hiçbir
 * sayfa `/admin/universities/null/...` gibi bir URL kuramaz.
 *
 * Roller/yetkiler gibi tenant'sız bölümler bunu KULLANMAZ.
 */
export default function RequireUniversity({
  children,
}: {
  children: (universityId: string) => ReactNode;
}) {
  const { universityId, isLoading, isError, error } = useAdminScope();

  if (isLoading) return <PageLoader label="Yönetim kapsamı yükleniyor..." />;

  if (isError) {
    return (
      <div className="alert-error">
        {getErrorMessage(error, "Yönetim kapsamı yüklenemedi.")}
      </div>
    );
  }

  if (!universityId) {
    return (
      <EmptyState
        icon="university"
        title="Yönetilecek üniversite yok"
        description="Hesabınız hiçbir üniversitenin yönetim kapsamında değil. Bu bölüm bir üniversite gerektirir."
      />
    );
  }

  return <>{children(universityId)}</>;
}
