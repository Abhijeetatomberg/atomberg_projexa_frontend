import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { POC_STAGE_LABELS } from '@/lib/constants';
import { pocStagePct } from '@/lib/poc';
import { fmtDate } from '@/lib/utils';

const stCol = (s) => ({ Completed: '#059669', 'On Track': '#7c3aed', 'At Risk': '#d97706', 'Not Started': '#94a3b8', Skipped: '#cbd5e1' }[s] || '#94a3b8');
const stBadge = (s) => ({
  Completed: 'bg-emerald-100 text-emerald-700', 'At Risk': 'bg-amber-100 text-amber-700',
  'On Track': 'bg-indigo-100 text-indigo-700', Skipped: 'bg-slate-100 text-slate-600',
}[s] || 'bg-slate-100 text-slate-600');

export default function TimelineTab({ project }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stages = POC_STAGE_LABELS.map((lbl, i) => {
    const ts = (project.tasks || []).filter((t) => t.stage === i);
    const dates = (key) => ts.map((t) => t[key]).filter(Boolean).map((d) => +new Date(d));
    const planStart = dates('planStart').length ? new Date(Math.min(...dates('planStart'))) : null;
    const planEnd = dates('planEnd').length ? new Date(Math.max(...dates('planEnd'))) : null;
    const actualStart = dates('actualStart').length ? new Date(Math.min(...dates('actualStart'))) : null;
    const actualEnd = dates('actualEnd').length ? new Date(Math.max(...dates('actualEnd'))) : null;
    const skip = !!project.skip?.[i];
    const pct = pocStagePct(project, i);
    const allDone = pct === 100 && ts.length > 0;
    let status = skip ? 'Skipped' : (i < (project.stage || 0) || allDone) ? 'Completed' : i === (project.stage || 0) ? 'On Track' : 'Not Started';
    if (status === 'On Track' && planEnd && planEnd < today && !allDone) status = 'At Risk';
    return { i, lbl, planStart, planEnd, actualStart, actualEnd, skip, pct, status };
  });

  const active = stages.filter((s) => !s.skip);
  const done = active.filter((s) => s.status === 'Completed').length;
  const late = active.filter((s) => s.status === 'At Risk').length;

  if (!stages.some((s) => s.planStart)) {
    return <p className="text-sm text-muted-foreground">No dates yet — set the POC KO date in the POC Stages tab to generate the schedule.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Stages Complete</div><div className="text-2xl font-bold mt-1">{done}/{active.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Overall Complete</div><div className="text-2xl font-bold mt-1">{Math.round(active.reduce((a, s) => a + s.pct, 0) / (active.length || 1))}%</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Stages At Risk</div><div className="text-2xl font-bold mt-1" style={{ color: late ? '#dc2626' : undefined }}>{late}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">POC Gantt — plan &amp; progress by stage</CardTitle></CardHeader>
        <CardContent className="space-y-2.5">
          {stages.filter((s) => !s.skip).map((s) => (
            <div key={s.lbl} className="flex items-center gap-3">
              <div className="w-32 shrink-0 text-xs font-medium">{s.lbl}<div className="text-[10px] text-muted-foreground">{s.pct}%</div></div>
              <div className="flex-1 h-5 rounded bg-muted overflow-hidden relative">
                {s.planStart && s.planEnd ? (
                  <div className="h-full rounded" style={{ width: `${Math.max(s.pct, 4)}%`, background: stCol(s.status) }} />
                ) : <span className="text-[10px] text-muted-foreground absolute left-2 top-1">no dates</span>}
              </div>
              <Badge variant="outline" className={`${stBadge(s.status)} shrink-0`}>{s.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Stage Schedule</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stage</TableHead><TableHead>% Complete</TableHead><TableHead>Plan Start</TableHead>
                <TableHead>Plan End</TableHead><TableHead>Actual Start</TableHead><TableHead>Actual End</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stages.map((s) => (
                <TableRow key={s.lbl} className={s.skip ? 'opacity-50' : undefined}>
                  <TableCell className="font-medium">{s.lbl}</TableCell>
                  <TableCell>{s.pct}%</TableCell>
                  <TableCell className="text-muted-foreground">{s.planStart ? fmtDate(s.planStart.toISOString().slice(0, 10)) : '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{s.planEnd ? fmtDate(s.planEnd.toISOString().slice(0, 10)) : '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{s.actualStart ? fmtDate(s.actualStart.toISOString().slice(0, 10)) : '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{s.actualEnd ? fmtDate(s.actualEnd.toISOString().slice(0, 10)) : '—'}</TableCell>
                  <TableCell><Badge variant="outline" className={stBadge(s.status)}>{s.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
