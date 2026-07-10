// Kullanıcı detay modalının paylaşılan veri katmanı.
// Bölüm bileşenleri kendi mutasyonlarını taşır ama hepsi aynı cache'i tazeler.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminUser } from "@/features/admin/api";
import { useAuth } from "@/features/auth/hooks/useAuth";

export const userDetailKey = (universityId: string, userId: string | null) =>
  ["admin", universityId, "user", userId] as const;

export function useUserDetailQuery(universityId: string, userId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: userDetailKey(universityId, userId),
    queryFn: () => getAdminUser(universityId, userId!),
    enabled: enabled && !!userId,
  });
}

/** Mutasyon sonrası: detay + liste, ve hedef ben isem kendi etkin yetkilerim. */
export function useInvalidateUserDetail(universityId: string, userId: string | null) {
  const queryClient = useQueryClient();
  const { user: me } = useAuth();

  return () => {
    queryClient.invalidateQueries({ queryKey: userDetailKey(universityId, userId) });
    queryClient.invalidateQueries({ queryKey: ["admin", universityId, "users"] });
    if (userId === me?.id) queryClient.invalidateQueries({ queryKey: ["auth", "permissions"] });
  };
}
