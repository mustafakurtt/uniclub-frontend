// Kullanıcı moderasyonu — GET/POST /api/moderation/universities/:universityId/users/:userId/...
import type { UserStatus } from "./user";

export type ModerationActionType = "ban" | "unban" | "password_reset" | "anonymize";

export interface ModerationActor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ModerationHistoryItem {
  id: string;
  userId: string;
  actorId: string;
  action: ModerationActionType;
  reason: string | null;
  previousStatus: UserStatus | null;
  newStatus: UserStatus | null;
  createdAt: string;
  actor: ModerationActor | null;
}

export interface ModerationHistoryPage {
  items: ModerationHistoryItem[];
  nextCursor: string | null;
}

export interface PasswordResetResult {
  temporaryPassword: string;
}

export type BanUserPayload = {
  reason: string;
};
