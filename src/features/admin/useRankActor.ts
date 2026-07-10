// Rütbe kararlarını veren "aktör"ü oturumdan türetir (bkz. ./rank.ts).
// Tek giriş noktası olmasının sebebi: maxRank ve super_admin muafiyeti her
// çağrı yerinde elle toplanırsa biri unutulur.
import { useMemo } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { RankActor } from "./rank";

export function useRankActor(): RankActor {
  const { user, maxRank, isSuperAdmin } = useAuth();

  return useMemo(
    () => ({ userId: user?.id ?? "", maxRank, isSuperAdmin }),
    [user?.id, maxRank, isSuperAdmin]
  );
}
