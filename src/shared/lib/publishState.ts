import type { Announcement, ActivityListItem } from "@/shared/types";

/** Taslak + zamanlanmış yayın planı var mı? */
export function isScheduledDraft(item: {
  status: string;
  scheduledPublishAt?: string | null;
}): boolean {
  return item.status === "draft" && item.scheduledPublishAt != null;
}

export function draftListState(item: Announcement | ActivityListItem): "draft" | "scheduled" | "published" {
  if (item.status === "published") return "published";
  if (isScheduledDraft(item)) return "scheduled";
  return "draft";
}
