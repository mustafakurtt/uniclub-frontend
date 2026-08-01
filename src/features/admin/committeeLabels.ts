import type { CommitteeVoteValue } from "@/shared/types";

/** Form önizlemesi — yalnızca kurul oluştururken canlı eşik gösterimi için. */
export function committeeMajorityRequiredPreview(memberCount: number): number {
  return memberCount > 0 ? Math.floor(memberCount / 2) + 1 : 0;
}

export const COMMITTEE_VOTE_LABELS: Record<CommitteeVoteValue, string> = {
  approve: "Onay",
  reject: "Ret",
};

/** Ret oyu gerekçesi — backend ve diğer formlarla aynı minimum. */
export const COMMITTEE_REJECT_REASON_MIN = 10;
