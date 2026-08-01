interface FormationProposalProgressProps {
  supportCount: number;
  supportThreshold: number;
  className?: string;
}

export default function FormationProposalProgress({
  supportCount,
  supportThreshold,
  className = "",
}: FormationProposalProgressProps) {
  const threshold = Math.max(supportThreshold, 1);
  const pct = Math.min(100, Math.round((supportCount / threshold) * 100));

  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
        <span>
          {supportCount} / {supportThreshold} destek
        </span>
        <span className="text-slate-400">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
