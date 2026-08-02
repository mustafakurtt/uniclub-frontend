import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useIsClubStaff } from "@/features/clubs/hooks/useClubRole";
import PageLoader from "@/shared/ui/PageLoader";

interface RequireClubStaffRouteProps {
  children: React.ReactNode;
}

/** Kulüp-içi staff (danışman/officer/başkan) — global RBAC değil (FRONTEND_CLUBS.md §1). */
export default function RequireClubStaffRoute({ children }: RequireClubStaffRouteProps) {
  const { clubId = "" } = useParams();
  const { isLoading } = useAuth();
  const isStaff = useIsClubStaff(clubId);

  if (!clubId) {
    return <Navigate to="/clubs" replace />;
  }

  if (isLoading) {
    return <PageLoader label="Yetki kontrol ediliyor..." />;
  }

  if (!isStaff) {
    return <Navigate to={`/clubs/${clubId}`} replace />;
  }

  return <>{children}</>;
}
