import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import PageLoader from "@/shared/ui/PageLoader";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Token var ama /auth/me henüz dönmedi: yönlendirmeden önce bekle,
  // aksi halde her yenilemede login'e sıçrama olur.
  if (isLoading) {
    return <PageLoader fullScreen label="Oturum kontrol ediliyor..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
