import type { AppNotification } from "@/shared/types";

/** Backend bildirim tipi — kurul üyesine oy beklentisi. */
export const COMMITTEE_PENDING_NOTIFICATION_TYPE = "club.application.committee_pending";

const readString = (data: Record<string, unknown> | null, key: string): string | null => {
  const value = data?.[key];
  return typeof value === "string" ? value : null;
};

export function isCommitteePendingNotification(notification: AppNotification): boolean {
  return notification.type === COMMITTEE_PENDING_NOTIFICATION_TYPE;
}

export function committeePendingApplicationId(notification: AppNotification): string | null {
  return readString(notification.data, "applicationId");
}

export interface CommitteeVotePendingItem {
  applicationId: string;
  title: string;
  body: string | null;
  createdAt: string;
}

/** Bildirim akışından benzersiz başvuru listesi — ayrı liste ucu yok. */
export function deriveCommitteeVotePendingItems(
  notifications: AppNotification[]
): CommitteeVotePendingItem[] {
  const seen = new Set<string>();
  const items: CommitteeVotePendingItem[] = [];

  for (const notification of notifications) {
    if (!isCommitteePendingNotification(notification)) continue;
    const applicationId = committeePendingApplicationId(notification);
    if (!applicationId || seen.has(applicationId)) continue;
    seen.add(applicationId);
    items.push({
      applicationId,
      title: notification.title,
      body: notification.body,
      createdAt: notification.createdAt,
    });
  }

  return items;
}
