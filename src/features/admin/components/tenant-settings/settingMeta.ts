import type { IconName } from "@/shared/ui/Icon";
import type { TenantSettingView } from "@/shared/types";

export interface SettingCategory {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  keys: readonly string[];
}

export const SETTING_CATEGORIES: SettingCategory[] = [
  {
    id: "announcements",
    title: "Duyurular",
    description:
      "Kulüp ve okul geneli duyurularında sabitleme ile yayın hızı sınırlarını belirler.",
    icon: "announcement",
    keys: [
      "announcement.club.pinned.max",
      "announcement.university.pinned.max",
      "announcement.university.publish.per_hour",
    ],
  },
  {
    id: "clubs",
    title: "Kulüp başvuruları",
    description:
      "Yeni kulüp kuruluş taleplerinin hangi roller üzerinden, kaç kademede onaylanacağını tanımlar.",
    icon: "club",
    keys: ["club.application.approval_chain"],
  },
];

const SETTING_DESCRIPTIONS: Record<string, string> = {
  "announcement.club.pinned.max":
    "Her kulüp aynı anda en fazla bu kadar duyuruyu listenin üstünde sabitleyebilir. Kotayı dolduran kulüpler yeni sabitleme yapamaz.",
  "announcement.university.pinned.max":
    "Kampüs vitrininde öne çıkarılabilecek okul geneli duyuru sayısı. Üst sınır, tüm kulüplerin toplam sabitlemesinden bağımsızdır.",
  "announcement.university.publish.per_hour":
    "Tüm üniversitede saatlik yayınlanabilecek okul geneli duyuru üst sınırı. Aşıldığında yeni yayın geçici olarak engellenir.",
  "club.application.approval_chain":
    "Kuruluş başvurusu kademe kademe ilerler; her adımda seçilen rol onay veya red verebilir. Son kademe tamamlandığında kulüp oluşturulur.",
};

export function settingDescription(key: string, meta: TenantSettingView): string {
  return SETTING_DESCRIPTIONS[key] ?? meta.labelTr;
}

export function groupSettingsByCategory(
  entries: [string, TenantSettingView][]
): { category: SettingCategory; items: [string, TenantSettingView][] }[] {
  const used = new Set<string>();
  const grouped: { category: SettingCategory; items: [string, TenantSettingView][] }[] = [];

  for (const category of SETTING_CATEGORIES) {
    const items = entries.filter(([key]) => category.keys.includes(key));
    if (items.length === 0) continue;
    items.forEach(([key]) => used.add(key));
    grouped.push({ category, items });
  }

  const other = entries.filter(([key]) => !used.has(key));
  if (other.length > 0) {
    grouped.push({
      category: {
        id: "other",
        title: "Diğer",
        description: "Katalogdan gelen ek politika ayarları.",
        icon: "settings",
        keys: other.map(([key]) => key),
      },
      items: other,
    });
  }

  return grouped;
}
