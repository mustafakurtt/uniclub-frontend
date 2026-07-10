import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";

/**
 * Öğrenci self-service kabuğunu tenant'sız hesaplara kapatır
 * (FRONTEND_RUTBE_VE_PLATFORM.md §1).
 *
 * Platform çalışanının (`universityId === null`) "hangi okulun kulüpleri?"
 * sorusu tanımsızdır; backend bu rotalarda
 *   400 "Bu işlem bir üniversiteye bağlı hesap gerektirir."
 * döner. Bu yüzden öğrenci sekmelerini hiç render etmiyor, doğrudan yönetim
 * paneline gönderiyoruz.
 */
export default function RequireTenantAccount({ children }: { children: React.ReactNode }) {
  const { isPlatformAccount } = useAuth();

  if (isPlatformAccount) return <Navigate to="/admin" replace />;

  return <>{children}</>;
}
