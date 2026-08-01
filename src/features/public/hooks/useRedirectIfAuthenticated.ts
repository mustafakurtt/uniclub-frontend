import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";

/** Giriş yapmış kullanıcıyı uygulama içi sayfaya yönlendir (paylaşım linki → app). */
export function useRedirectIfAuthenticated(target: string | null) {
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token && target) {
      navigate(target, { replace: true });
    }
  }, [token, target, navigate]);
}
