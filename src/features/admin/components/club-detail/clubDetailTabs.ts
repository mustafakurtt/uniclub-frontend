export const CLUB_DETAIL_TABS = [
  { key: "members", label: "Üyeler" },
  { key: "activities", label: "Etkinlikler" },
  { key: "announcements", label: "Duyurular" },
  { key: "advisors", label: "Danışmanlar" },
  { key: "gallery", label: "Galeri" },
  { key: "audit", label: "Denetim izi" },
] as const;

export type ClubDetailTab = (typeof CLUB_DETAIL_TABS)[number]["key"];

const VALID = new Set<string>(CLUB_DETAIL_TABS.map((t) => t.key));

export function parseClubDetailTab(value: string | null): ClubDetailTab {
  if (value && VALID.has(value)) return value as ClubDetailTab;
  return "members";
}
