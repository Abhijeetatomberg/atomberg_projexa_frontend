import PortfolioGantt from '@/components/charts/PortfolioGantt';
import { GATE_LABELS } from '@/lib/constants';
import { npdPct, npdGatePct, npdHealth } from '@/lib/npd';

// Single-project Gantt, built the same way DashboardPage builds portfolio rows —
// one segment per gate, colored by completion / lateness.
export default function TimelineTab({ project }) {
  const tasks = project.tasks || [];
  const byGate = {};
  tasks.forEach((t) => {
    if (!t.planStart || !t.planEnd) return;
    if (!byGate[t.gi]) byGate[t.gi] = [];
    byGate[t.gi].push(t);
  });

  let start = null;
  let end = null;
  tasks.forEach((t) => {
    if (t.planStart) { const d = new Date(t.planStart); if (!start || d < start) start = d; }
    if (t.planEnd) { const d = new Date(t.planEnd); if (!end || d > end) end = d; }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let firstOpen = null;
  const segs = Object.keys(byGate).map(Number).sort((a, b) => a - b).map((gi) => {
    const ts = byGate[gi];
    const s = new Date(Math.min(...ts.map((t) => +new Date(t.planStart))));
    const e = new Date(Math.max(...ts.map((t) => +new Date(t.planEnd))));
    const pct = npdGatePct(project, gi);
    let color = '#cbd5e1';
    if (pct >= 100) color = '#059669';
    else if (e < today) color = '#dc2626';
    else if (firstOpen === null) { color = '#2563eb'; firstOpen = gi; }
    return { start: s, end: e, color, title: `${GATE_LABELS[gi + 1] || ''} · ${pct}%` };
  });

  const health = npdHealth(project);
  const row = {
    id: project.id,
    name: project.name,
    sub: start ? `${project.cust || ''} · ${GATE_LABELS[project.gate || 0]}` : 'KO pending',
    to: `/npd/${project.id}`,
    start,
    end,
    pct: npdPct(project),
    healthColor: health.color,
    segs,
  };

  return (
    <div className="space-y-2">
      {!project.koDone && <p className="text-sm text-muted-foreground">Plan dates are generated once the kick-off runs.</p>}
      <PortfolioGantt rows={start ? [row] : []} />
    </div>
  );
}
