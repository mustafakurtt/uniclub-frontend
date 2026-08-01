/** Kulüp yönetimi listesine dönüş — filtre/sayfa durumu query string'de kalır. */
export function adminClubsListHref(params: {
  from?: string | null;
  status?: string | null;
  clubStatus?: string | null;
}): string {
  const qs = new URLSearchParams();
  qs.set("tab", params.from === "formation" ? "formation" : "applications");
  if (params.status) qs.set("status", params.status);
  if (params.clubStatus) qs.set("clubStatus", params.clubStatus);
  const query = qs.toString();
  return query ? `/admin/clubs?${query}` : "/admin/clubs";
}

export function adminDetailQuery(from: "applications" | "formation", status: string): string {
  const qs = new URLSearchParams({ from, status });
  return `?${qs.toString()}`;
}

/** Kulüp detayına giderken liste filtresini geri dönüş için taşır. */
export function adminClubDetailHref(
  clubId: string,
  params?: { clubStatus?: string | null; tab?: string | null }
): string {
  const qs = new URLSearchParams();
  if (params?.clubStatus) qs.set("clubStatus", params.clubStatus);
  if (params?.tab) qs.set("tab", params.tab);
  const query = qs.toString();
  return query ? `/admin/clubs/${clubId}?${query}` : `/admin/clubs/${clubId}`;
}

export function adminClubsListHrefFromClub(clubStatus?: string | null): string {
  const qs = new URLSearchParams();
  if (clubStatus) qs.set("clubStatus", clubStatus);
  const query = qs.toString();
  return query ? `/admin/clubs?${query}` : "/admin/clubs";
}

/** Kullanıcı listesine dönüş — filtre query string'de kalır. */
export function adminUsersListHref(params: {
  status?: string | null;
  role?: string | null;
}): string {
  const qs = new URLSearchParams();
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.role) qs.set("role", params.role);
  const query = qs.toString();
  return query ? `/admin/users?${query}` : "/admin/users";
}

export function adminUserDetailHref(
  userId: string,
  params?: { status?: string | null; role?: string | null }
): string {
  const qs = new URLSearchParams();
  if (params?.status && params.status !== "all") qs.set("status", params.status);
  if (params?.role) qs.set("role", params.role);
  const query = qs.toString();
  return query ? `/admin/users/${userId}?${query}` : `/admin/users/${userId}`;
}
