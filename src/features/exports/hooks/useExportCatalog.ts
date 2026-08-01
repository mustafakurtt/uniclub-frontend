import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getExportCatalog } from "@/features/exports/api/exports";

export type ExportCatalogState =
  | { status: "loading" }
  | { status: "disabled" }
  | { status: "error"; error: unknown }
  | { status: "ready"; reports: Awaited<ReturnType<typeof getExportCatalog>> };

export function useExportCatalog(universityId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["exports", universityId, "catalog"],
    queryFn: async (): Promise<ExportCatalogState> => {
      if (!universityId) return { status: "disabled" };
      try {
        const reports = await getExportCatalog(universityId);
        return { status: "ready", reports };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return { status: "disabled" };
        }
        throw error;
      }
    },
    enabled: enabled && Boolean(universityId),
    staleTime: 60_000,
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) return false;
      return failureCount < 1;
    },
  });
}

export function resolveExportCatalog(query: ReturnType<typeof useExportCatalog>): ExportCatalogState {
  if (query.isLoading) return { status: "loading" };
  if (query.isError) return { status: "error", error: query.error };
  return query.data ?? { status: "loading" };
}
