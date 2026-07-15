// Horizontal multi-segment bar list — e.g. per-project status distribution
// where each row shows several colored segments (proportional) instead of a
// single value. Mirrors the "fpb" stacked bars in the legacy app.
// items: [{ label, total?, segments: [{ value, color, title? }] }]
export default function StackedBarList({ items }) {
  if (!items.length) return <p className="text-sm text-muted-foreground p-3">No data</p>;
  return (
    <div className="space-y-2">
      {items.map((it) => {
        const total = it.total ?? it.segments.reduce((a, s) => a + s.value, 0);
        return (
          <div key={it.label} className="flex items-center gap-2 text-xs">
            <div className="w-28 truncate text-muted-foreground" title={it.label}>{it.label || '—'}</div>
            <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden flex">
              {total > 0
                ? it.segments.filter((s) => s.value > 0).map((s, i) => (
                  <span
                    key={i}
                    title={`${s.title || ''}: ${s.value}`}
                    style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
                  />
                ))
                : <span className="w-full bg-muted" />}
            </div>
            <div className="w-10 text-right font-medium">{total}</div>
          </div>
        );
      })}
    </div>
  );
}
