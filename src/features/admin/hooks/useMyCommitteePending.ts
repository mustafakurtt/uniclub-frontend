import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useAdminScope } from "@/features/admin/context/AdminScopeContext";
import { getMyCommitteePendingApplications } from "@/features/admin/api";
import type { MyCommitteePendingApplication } from "@/shared/types";

export const myCommitteePendingKeys = {
  all: ["admin", "my-committee-pending"] as const,
  list: (universityId: string) => [...myCommitteePendingKeys.all, universityId] as const,
};

type MyCommitteePendingData =
  | { access: "forbidden" }
  | { access: "ok"; items: MyCommitteePendingApplication[] };

export type MyCommitteePendingState =
  | { access: "loading" }
  | { access: "forbidden" }
  | { access: "error"; error: unknown }
  | { access: "ok"; items: MyCommitteePendingApplication[] };

export function useMyCommitteePendingApplications(
  universityId: string | null
): MyCommitteePendingState {
  const query = useQuery({
    queryKey: myCommitteePendingKeys.list(universityId ?? ""),
    queryFn: async (): Promise<MyCommitteePendingData> => {
      try {
        const items = await getMyCommitteePendingApplications(universityId!);
        return { access: "ok", items };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          return { access: "forbidden" };
        }
        throw error;
      }
    },
    enabled: universityId != null,
    retry: false,
  });

  if (query.isLoading) return { access: "loading" };
  if (query.isError) return { access: "error", error: query.error };
  if (!query.data) return { access: "loading" };
  if (query.data.access === "forbidden") return { access: "forbidden" };
  return { access: "ok", items: query.data.items };
}

/** Kurul görevleri ana sayfa bloğu — menüden çıkarıldı (Dalga 1 IA). */
export function useShowCommitteeTasksNav(): boolean {
  const { universityId } = useAdminScope();
  const pending = useMyCommitteePendingApplications(universityId);
  return pending.access === "ok" && pending.items.length > 0;
}
