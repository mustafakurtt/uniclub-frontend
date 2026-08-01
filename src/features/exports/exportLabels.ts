import { ACTIVITY_STATUS_LABELS } from "@/features/activities/labels";
import {
  CLUB_ROLE_LABELS,
  CLUB_STATUS_LABELS,
  MEMBERSHIP_STATUS_LABELS,
} from "@/features/clubs/labels";
import type { ActivityStatus, ClubRole, ClubStatus, MembershipStatus } from "@/shared/types";

export function exportEnumLabel(reportId: string, paramName: string, value: string): string {
  if (reportId === "clubs" && paramName === "status") {
    return CLUB_STATUS_LABELS[value as ClubStatus] ?? value;
  }
  if (reportId === "club-members") {
    if (paramName === "role") return CLUB_ROLE_LABELS[value as ClubRole] ?? value;
    if (paramName === "status") return MEMBERSHIP_STATUS_LABELS[value as MembershipStatus] ?? value;
  }
  if (reportId === "activities" && paramName === "status") {
    return ACTIVITY_STATUS_LABELS[value as ActivityStatus] ?? value;
  }
  return value;
}
