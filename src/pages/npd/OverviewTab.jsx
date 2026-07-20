import { Flag, Gauge, ListChecks, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatTile from '@/components/ui/stat-tile';
import { GATE_LABELS, badgeForStatus } from '@/lib/constants';
import { npdPct, npdGatePct } from '@/lib/npd';
import { fmtDate } from '@/lib/utils';

export default function OverviewTab({ project }) {
  const tasks = project.tasks || [];
  const pct = npdPct(project);
  const done = tasks.filter((t) => t.status?.startsWith('Completed')).length;
  const pending = tasks.filter((t) => !t.status?.startsWith('Completed'))
    .sort((a, b) => (a.planEnd || '9999').localeCompare(b.planEnd || '9999'));
  const teamNames = [...new Set([...(project.team || []), ...Object.values(project.charter?.team || {})].filter(Boolean))];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={Flag} color="#2563eb" value={GATE_LABELS[project.gate] || '—'} label="Current Gate" caption={`${pct}% overall`} />
        <StatTile icon={Gauge} color="#7c3aed" value={`${pct}%`} label="Overall Progress" barPct={pct} />
        <StatTile icon={ListChecks} color={pending.length ? '#d97706' : '#059669'} value={pending.length} label="Pending Tasks" caption={`${done} of ${tasks.length} done`} />
        <StatTile icon={Building2} color="#0f766e" value={project.businessUnit || '—'} label="Business Unit" caption={project.devType || 'NPD'} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Pending Tasks</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">✓ All tasks complete</p>
            ) : pending.slice(0, 8).map((t) => (
              <div key={`${t.gi}-${t.n}`} className="flex items-center justify-between gap-2 text-[13px] py-1 border-b last:border-0">
                <span className="truncate">{t.n} · {t.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{t.resp || 'unassigned'}</span>
                  <Badge variant="outline" className={badgeForStatus(t.status)}>{t.status || 'Not Started'}</Badge>
                </div>
              </div>
            ))}
            {pending.length > 8 && <p className="text-xs text-muted-foreground pt-1">+ {pending.length - 8} more pending tasks</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Schedule &amp; Team</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-xs text-muted-foreground">KO Date</div>{project.koIso ? fmtDate(project.koIso) : <span className="text-muted-foreground">after charter</span>}</div>
              <div><div className="text-xs text-muted-foreground">SOP / Launch</div>{project.launch || 'TBD'}</div>
              <div><div className="text-xs text-muted-foreground">Customer</div>{project.cust || '—'}</div>
              <div><div className="text-xs text-muted-foreground">Category</div>{project.category || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Team</div>
              {teamNames.length === 0 ? (
                <p className="text-sm text-muted-foreground">No team assigned</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {teamNames.map((n) => <Badge key={n} variant="secondary">{n}</Badge>)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="text-sm font-semibold mb-2">Gate Progress</div>
        <div className="space-y-1.5">
          {project.koDone ? GATE_LABELS.slice(1).map((g, gi) => {
            const gp = npdGatePct(project, gi);
            return (
              <div key={g} className="flex items-center gap-2 text-xs">
                <span className="w-14 text-muted-foreground">{g}</span>
                <div className="flex-1 h-1.5 rounded bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${gp}%` }} /></div>
                <span className="w-9 text-right text-muted-foreground">{gp}%</span>
              </div>
            );
          }) : <p className="text-sm text-muted-foreground">Gate progress starts after kick-off.</p>}
        </div>
      </div>
    </div>
  );
}
