import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Stat tile matching the reference app's `.stat` card: label + big value on the
// left, a tinted icon box on the right, with an optional progress bar, pill
// row, or caption underneath. Used across Dashboard and every module's KPI row.
export default function StatTile({ icon: Icon, color = '#2563eb', value, label, caption, barPct, barColor, pills, ring, to, className }) {
  const tint = `${color}1a`;

  const body = (
    <div className={cn('rounded-lg border bg-card p-4 shadow-card', to && 'transition-shadow hover:shadow-elevated', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11.5px] font-medium text-muted-foreground">{label}</div>
          {!ring && <div className="mt-0.5 text-[27px] font-bold leading-none tracking-tight text-foreground">{value}</div>}
        </div>
        {ring ? (
          <div
            className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full text-[13px] font-bold"
            style={{ background: tint, color }}
          >
            {value}
          </div>
        ) : (
          Icon && (
            <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px]" style={{ background: tint, color }}>
              <Icon className="h-[19px] w-[19px]" />
            </div>
          )
        )}
      </div>
      {caption && <div className="mt-2 text-[10.5px] text-muted-foreground">{caption}</div>}
      {pills && <div className="mt-2.5 flex gap-1.5">{pills}</div>}
      {barPct != null && (
        <div className="mt-2.5 h-[5px] w-full overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, barPct))}%`, background: barColor || color }} />
        </div>
      )}
    </div>
  );

  return to ? <Link to={to} className="block">{body}</Link> : body;
}
