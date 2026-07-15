// Simple CSS conic-gradient donut chart. segments: [{ label, value, color }]
export default function Donut({ segments, total, size = 120, centerLabel }) {
  const sum = total ?? segments.reduce((a, s) => a + s.value, 0);
  let acc = 0;
  const stops = segments.length && sum > 0
    ? segments.map((s) => {
      const from = (acc / sum) * 360;
      acc += s.value;
      const to = (acc / sum) * 360;
      return `${s.color} ${from}deg ${to}deg`;
    }).join(', ')
    : '#e2e8f0 0deg 360deg';

  return (
    <div
      className="relative rounded-full grid place-items-center shrink-0"
      style={{ width: size, height: size, background: `conic-gradient(${stops})` }}
    >
      <div
        className="rounded-full bg-background grid place-items-center text-center"
        style={{ width: size * 0.62, height: size * 0.62 }}
      >
        <div>
          <div className="text-lg font-bold leading-none">{sum}</div>
          {centerLabel && <div className="text-[10px] text-muted-foreground mt-0.5">{centerLabel}</div>}
        </div>
      </div>
    </div>
  );
}
