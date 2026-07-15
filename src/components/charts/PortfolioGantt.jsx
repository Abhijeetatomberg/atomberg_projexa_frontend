import { Link } from 'react-router-dom';

// Portfolio timeline (Gantt-style) — mirrors portfolioGantt() in the legacy app.
// rows: [{ id, name, sub, to, start: Date|null, end: Date|null, pct, healthColor,
//          segs: [{ start: Date, end: Date, color, title }] }]
export default function PortfolioGantt({ rows }) {
  if (!rows.length) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No scheduled projects yet — kick off an NPD program or add POC stage dates to populate the timeline.
      </p>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let mn = null;
  let mx = null;
  rows.forEach((r) => {
    if (r.start && (!mn || r.start < mn)) mn = r.start;
    if (r.end && (!mx || r.end > mx)) mx = r.end;
  });
  if (!mn) mn = new Date(today);
  if (!mx) mx = new Date(today.getTime() + 120 * 86400000);
  if (today < mn) mn = new Date(today);
  if (today > mx) mx = new Date(today);
  mn = new Date(mn.getFullYear(), mn.getMonth(), 1);
  mx = new Date(mx.getFullYear(), mx.getMonth() + 1, 0);
  const span = mx - mn || 1;
  const pctOf = (d) => ((d - mn) / span) * 100;

  const months = [];
  let cur = new Date(mn.getFullYear(), mn.getMonth(), 1);
  while (cur <= mx) {
    const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    months.push({
      key: +cur,
      left: pctOf(cur),
      width: ((Math.min(next, mx) - cur) / span) * 100,
      label: cur.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
    });
    cur = next;
  }

  const showToday = today >= mn && today <= mx;

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="flex border-b pb-1">
            <div className="w-44 shrink-0 text-xs font-semibold text-muted-foreground">Project</div>
            <div className="relative flex-1 h-5">
              {months.map((m) => (
                <div key={m.key} className="absolute top-0 text-[10px] text-muted-foreground" style={{ left: `${m.left}%` }}>
                  {m.label}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2 mt-2">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center">
                <Link to={r.to} className="w-44 shrink-0 pr-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium truncate">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: r.healthColor }} />
                    <span className="truncate">{r.name}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate pl-3.5">{r.sub}</div>
                </Link>
                <div className="relative flex-1 h-6 rounded bg-muted/40">
                  {months.map((m) => (
                    <div key={m.key} className="absolute top-0 bottom-0 border-l" style={{ left: `${m.left}%` }} />
                  ))}
                  {showToday && (
                    <div className="absolute top-0 bottom-0 border-l border-dashed border-red-400 z-10" style={{ left: `${pctOf(today)}%` }} />
                  )}
                  {r.start && r.end ? (
                    <div className="absolute top-0.5 bottom-0.5 rounded overflow-hidden flex" style={{ left: `${pctOf(r.start)}%`, width: `${Math.max(1, pctOf(r.end) - pctOf(r.start))}%` }}>
                      {r.segs.length ? (
                        r.segs.map((s, i) => (
                          <div
                            key={i}
                            title={s.title}
                            className="h-full"
                            style={{ width: `${Math.max(0, ((s.end - s.start) / (r.end - r.start || 1)) * 100)}%`, background: s.color }}
                          />
                        ))
                      ) : (
                        <div className="h-full w-full" style={{ background: r.healthColor }} />
                      )}
                    </div>
                  ) : (
                    <div className="absolute left-2 top-1 text-[10px] text-muted-foreground">KO pending</div>
                  )}
                </div>
                <div className="w-10 text-right text-[11px] text-muted-foreground pl-2">{r.pct}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground pt-1 border-t">
        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm inline-block" style={{ background: '#059669' }} />Done</span>
        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm inline-block" style={{ background: '#2563eb' }} />In Progress</span>
        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm inline-block" style={{ background: '#dc2626' }} />Delayed</span>
        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm inline-block" style={{ background: '#cbd5e1' }} />Upcoming</span>
        <span className="ml-auto">Bar = KO → SOP timeline · segments = gates/stages · click a row to open</span>
      </div>
    </div>
  );
}
