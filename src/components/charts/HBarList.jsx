// Horizontal bar-list widget, e.g. "Investment by Business Unit" / "Open Tasks by Department"
export default function HBarList({ items, fmt, color = '#2563eb' }) {
  if (!items.length) return <p className="text-sm text-muted-foreground p-3">No data</p>;
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-2 text-xs">
          <div className="w-28 truncate text-muted-foreground">{i.label}</div>
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(i.value / max) * 100}%`, background: i.color || color }} />
          </div>
          <div className="w-16 text-right font-medium">{fmt ? fmt(i.value) : i.value}</div>
        </div>
      ))}
    </div>
  );
}
