interface PosterQrBarChartItem {
  key: string;
  label: string;
  count: number;
}

interface PosterQrBarChartProps {
  items: PosterQrBarChartItem[];
  emptyLabel?: string;
}

/** CSS çubuk grafiği — harici grafik kütüphanesi yok. */
export default function PosterQrBarChart({
  items,
  emptyLabel = "Henüz tarama yok.",
}: PosterQrBarChartProps) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">{emptyLabel}</p>;
  }

  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.key} className="grid grid-cols-[minmax(4.5rem,6rem)_1fr_2rem] items-center gap-2 text-xs">
          <span className="truncate font-medium text-slate-600" title={item.label}>
            {item.label}
          </span>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-300"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
          <span className="text-right font-semibold tabular-nums text-slate-700">{item.count}</span>
        </div>
      ))}
    </div>
  );
}
