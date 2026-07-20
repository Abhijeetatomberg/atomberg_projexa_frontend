import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatTile from '@/components/ui/stat-tile';
import Donut from '@/components/charts/Donut';
import { Layers, TrendingUp, ClipboardList, Box } from 'lucide-react';
import { POC_STAGE_LABELS, badgeForStatus } from '@/lib/constants';
import { pocPct, pocActiveTasks, pocStagePct } from '@/lib/poc';
import { taskBucket } from '@/lib/utils';
import { fmtDate } from '@/lib/utils';

const STATUS_COLOR = { done: '#059669', ontrack: '#2563eb', behind: '#d97706', atrisk: '#ea580c', delayed: '#dc2626', ns: '#94a3b8' };
const STATUS_LABEL = { done: 'Completed', ontrack: 'On Track', behind: 'Behind', atrisk: 'At Risk', delayed: 'Delayed', ns: 'Not Started' };

export default function OverviewTab({ project }) {
  const tasks = pocActiveTasks(project);
  const pct = pocPct(project);
  const buckets = { done: 0, ontrack: 0, behind: 0, atrisk: 0, delayed: 0, ns: 0 };
  tasks.forEach((t) => { buckets[taskBucket(t.status, t.pct)]++; });
  const pending = tasks.length - buckets.done;
  const parts = project.parts || [];
  const recv = parts.filter((pt) => pt.proc === 'Received').length;
  const ordered = parts.filter((pt) => pt.proc === 'Ordered').length;
  const toProc = parts.length - recv - ordered;
  const pendParts = parts.length - recv;

  const pendingTasks = tasks.filter((t) => taskBucket(t.status, t.pct) !== 'done')
    .sort((a, b) => (a.planEnd || '9999').localeCompare(b.planEnd || '9999'));
  const pendingParts = parts.filter((pt) => pt.proc !== 'Received');

  const segs = Object.keys(buckets).filter((k) => buckets[k] > 0).map((k) => ({ label: STATUS_LABEL[k], value: buckets[k], color: STATUS_COLOR[k] }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={Layers} color="#7c3aed" value={POC_STAGE_LABELS[project.stage || 0]} label="Current Stage" caption={`Stage ${(project.stage || 0) + 1} of ${POC_STAGE_LABELS.length}`} />
        <StatTile icon={TrendingUp} color="#2563eb" value={`${pct}%`} label="Overall Progress" barPct={pct} />
        <StatTile icon={ClipboardList} color={pending ? '#d97706' : '#059669'} value={pending} label="Pending Tasks" caption={`${buckets.done} of ${tasks.length} done`} />
        <StatTile icon={Box} color={pendParts ? '#d97706' : '#059669'} value={pendParts} label="Pending Parts" caption={`${recv} of ${parts.length} received`} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Task Status Breakdown</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-6 justify-center flex-wrap">
            <Donut segments={segs} total={tasks.length} centerLabel="tasks" />
            <div className="space-y-1">
              {segs.length === 0 ? <p className="text-sm text-muted-foreground">No tasks yet</p> : segs.map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                  {s.label} <b>{s.value}</b>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Stage Progress</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">
            {POC_STAGE_LABELS.map((lbl, i) => {
              if (project.skip?.[i]) return <div key={lbl} className="flex items-center gap-2 text-xs text-muted-foreground"><span className="w-24">{lbl}</span><Badge variant="secondary">skip</Badge></div>;
              const sp = pocStagePct(project, i);
              const cur = i === (project.stage || 0);
              return (
                <div key={lbl} className="flex items-center gap-2 text-xs">
                  <span className={cur ? 'w-24 font-semibold text-primary' : 'w-24 text-muted-foreground'}>{cur ? '▸ ' : ''}{lbl}</span>
                  <div className="flex-1 h-1.5 rounded bg-muted overflow-hidden"><div className="h-full" style={{ width: `${sp}%`, background: sp === 100 ? '#059669' : cur ? '#7c3aed' : '#cbd5e1' }} /></div>
                  <span className="w-9 text-right text-muted-foreground">{sp}%</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Parts Readiness</CardTitle></CardHeader>
          <CardContent>
            <div className="flex h-5 rounded overflow-hidden bg-muted">
              {recv > 0 && <div style={{ width: `${(recv / (parts.length || 1)) * 100}%`, background: '#059669' }} title={`Received: ${recv}`} />}
              {ordered > 0 && <div style={{ width: `${(ordered / (parts.length || 1)) * 100}%`, background: '#d97706' }} title={`Ordered: ${ordered}`} />}
              {toProc > 0 && <div style={{ width: `${(toProc / (parts.length || 1)) * 100}%`, background: '#cbd5e1' }} title={`To procure: ${toProc}`} />}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm inline-block" style={{ background: '#059669' }} />Received <b className="text-foreground">{recv}</b></span>
              <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm inline-block" style={{ background: '#d97706' }} />Ordered <b className="text-foreground">{ordered}</b></span>
              <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm inline-block" style={{ background: '#cbd5e1' }} />To procure <b className="text-foreground">{Math.max(toProc, 0)}</b></span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Schedule Health</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-xs text-muted-foreground">KO Date</div>{project.koDate ? fmtDate(project.koDate) : <span className="text-muted-foreground">not set</span>}</div>
            <div><div className="text-xs text-muted-foreground">Customer</div>{project.cust || '—'}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Pending Tasks</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">
            {pendingTasks.length === 0 ? <p className="text-sm text-muted-foreground">✓ All tasks complete</p> : pendingTasks.slice(0, 6).map((t) => (
              <div key={t.n} className="flex items-center justify-between gap-2 text-[13px] py-1 border-b last:border-0">
                <span className="truncate">{t.n} · {t.name}</span>
                <Badge variant="outline" className={badgeForStatus(t.status)}>{t.status || 'Not Started'}</Badge>
              </div>
            ))}
            {pendingTasks.length > 6 && <p className="text-xs text-muted-foreground pt-1">+ {pendingTasks.length - 6} more pending tasks</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pending Parts</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">
            {parts.length === 0 ? <p className="text-sm text-muted-foreground">No parts added yet</p>
              : pendingParts.length === 0 ? <p className="text-sm text-muted-foreground">✓ All parts received</p>
                : pendingParts.slice(0, 6).map((pt, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-[13px] py-1 border-b last:border-0">
                    <span className="truncate">{pt.pno || '—'} · {pt.desc || '(part)'}</span>
                    <Badge variant="secondary">{pt.proc || 'To procure'}</Badge>
                  </div>
                ))}
            {pendingParts.length > 6 && <p className="text-xs text-muted-foreground pt-1">+ {pendingParts.length - 6} more pending parts</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
