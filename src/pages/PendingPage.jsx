import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Npds, Pocs, MomActions, Samples, PpapDocs } from '@/api/resources';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { badgeForStatus } from '@/lib/constants';
import { cn, fmtDate, taskBucket, todayIso } from '@/lib/utils';

// Cross-module "everything still open" tracker, mirroring the Pending Tasks
// view in the original app: NPD tasks + POC tasks + MOM actions + samples + PPAP.
export default function PendingPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [srcFilter, setSrcFilter] = useState('');

  useEffect(() => {
    Promise.allSettled([Npds.list(), Pocs.list(), MomActions.list(), Samples.list(), PpapDocs.list()])
      .then(([npds, pocs, actions, samples, ppap]) => {
        const out = [];
        (npds.value || []).forEach((p) => (p.tasks || []).forEach((t) => {
          if (taskBucket(t.status, t.pct) !== 'done') {
            out.push({ src: 'NPD', proj: p.name, task: `${t.n ? t.n + ' · ' : ''}${t.name || ''}`, owner: t.resp || t.owner || '', status: t.status || 'Not Started', planEnd: t.planEnd || '' });
          }
        }));
        (pocs.value || []).forEach((p) => (p.tasks || []).forEach((t) => {
          if (p.skip?.[t.stage]) return;
          if (taskBucket(t.status, t.pct) !== 'done') {
            out.push({ src: 'POC', proj: p.name, task: `${t.n ? t.n + ' · ' : ''}${t.name || ''}`, owner: t.resp || '', status: t.status || 'Not Started', planEnd: t.planEnd || '' });
          }
        }));
        (actions.value || []).forEach((a) => {
          if (a.status !== 'Done') out.push({ src: 'Action', proj: a.proj || 'Weekly Review', task: a.text, owner: a.owner || '', status: a.status || 'Open', planEnd: a.due || '' });
        });
        (samples.value || []).forEach((s) => {
          if (!/(Completed|Submitted|Dropped)/.test(s.status || '')) {
            out.push({ src: 'Sample', proj: s.project || 'Sample', task: `${s.project || '(sample)'}${s.qty ? ` · ${s.qty} pcs` : ''}`, owner: s.owner || '', status: s.status || 'New', planEnd: s.plannedSub || '' });
          }
        });
        (ppap.value || []).forEach((d) => {
          if (d.status !== 'Approved') out.push({ src: 'PPAP', proj: d.proj, task: d.element, owner: d.owner || '', status: d.status, planEnd: d.due || '' });
        });
        out.sort((a, b) => (a.planEnd || '9999') < (b.planEnd || '9999') ? -1 : 1);
        setItems(out);
      })
      .finally(() => setLoading(false));
  }, []);

  const today = todayIso();
  const filtered = useMemo(
    () => items.filter((it) =>
      (!srcFilter || it.src === srcFilter) &&
      (!q || `${it.proj} ${it.task} ${it.owner}`.toLowerCase().includes(q.toLowerCase()))
    ),
    [items, q, srcFilter]
  );
  const overdue = items.filter((it) => it.planEnd && it.planEnd < today).length;
  const sources = ['NPD', 'POC', 'Action', 'Sample', 'PPAP'];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">Pending Tasks</h1>
          <p className="text-sm text-muted-foreground">Everything still open across all modules</p>
        </div>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 w-56" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
        <Card className={cn('cursor-pointer', srcFilter === '' && 'ring-2 ring-primary')} onClick={() => setSrcFilter('')}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold">{items.length}</div>
            <div className="text-xs text-muted-foreground">Total Open</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{overdue}</div>
            <div className="text-xs text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
        {sources.map((s) => (
          <Card key={s} className={cn('cursor-pointer', srcFilter === s && 'ring-2 ring-primary')} onClick={() => setSrcFilter(srcFilter === s ? '' : s)}>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">{items.filter((i) => i.src === s).length}</div>
              <div className="text-xs text-muted-foreground">{s}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Plan End</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>
          ) : filtered.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Nothing pending 🎉</TableCell></TableRow>
          ) : filtered.map((it, i) => {
            const isOverdue = it.planEnd && it.planEnd < today;
            return (
              <TableRow key={i}>
                <TableCell><Badge variant="secondary">{it.src}</Badge></TableCell>
                <TableCell className="font-medium">{it.proj}</TableCell>
                <TableCell className="max-w-md">{it.task}</TableCell>
                <TableCell>{it.owner || '—'}</TableCell>
                <TableCell className={cn(isOverdue && 'text-red-600 font-semibold')}>{fmtDate(it.planEnd)}</TableCell>
                <TableCell><Badge variant="outline" className={badgeForStatus(it.status)}>{it.status}</Badge></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
