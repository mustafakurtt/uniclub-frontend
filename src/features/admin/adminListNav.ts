/** Kulüp yönetimi listesine dönüş — filtre/sayfa durumu query string'de kalır. */
export function adminClubsListHref(params: {
  from?: string | null;
  status?: string | null;
}): string {
  const qs = new URLSearchParams();
  qs.set("tab", params.from === "formation" ? "formation" : "applications");
  if (params.status) qs.set("status", params.status);
  const query = qs.toString();
  return query ? `/admin/clubs?${query}` : "/admin/clubs";
}

export function adminDetailQuery(from: "applications" | "formation", status: string): string {
  const qs = new URLSearchParams({ from, status });
  return `?${qs.toString()}`;
}
