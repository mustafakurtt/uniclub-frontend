/** Backend tally eşiği — `threshold` veya `requiredApprovals`; istemcide hesaplanmaz. */
export type CommitteeTallyThresholdSource = {
  threshold?: number;
  requiredApprovals?: number;
};

export function committeeApprovalThreshold(tally: CommitteeTallyThresholdSource): number | null {
  const raw = tally.threshold ?? tally.requiredApprovals;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

export function formatCommitteeApprovalProgress(
  approveCount: number,
  threshold: number | null
): string {
  if (threshold == null) return `${approveCount} onay`;
  return `${approveCount} / ${threshold} onay`;
}

export function formatCommitteeThresholdLabel(threshold: number | null): string {
  return threshold == null ? "—" : String(threshold);
}
