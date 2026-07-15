import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Rocket, ArrowRight, GitBranch } from 'lucide-react';
import { Pocs, Npds } from '@/api/resources';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/toaster';
import { POC_STAGE_LABELS, POC_SKIPPABLE, TASK_ST, badgeForStatus } from '@/lib/constants';
import { buildPocTasks, pocStagePct, pocPct } from '@/lib/poc';
import { cn, fmtDate, todayIso } from '@/lib/utils';

export default function PocDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [stageView, setStageView] = useState(0);
  const [taskDlg, setTaskDlg] = useState(null); // global task index
  const [taskVals, setTaskVals] = useState({});

  useEffect(() => {
    Pocs.get(id).then((r) => { setP(r); setStageView(r.stage || 0); }).catch((e) => toast(e.message, 'error'));
  }, [id]);

  const patch = async (body) => {
    try {
      const u = await Pocs.update(p.id, body);
      setP(u);
      return u;
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  const conductKo = async () => {
    await patch({ koDone: true, koDate: todayIso(), tasks: buildPocTasks() });
    toast('POC kick-off done — stage plan generated', 'success');
  };

  const advanceStage = async () => {
    if ((p.stage || 0) >= POC_STAGE_LABELS.length - 1) return;
    if (!confirm(`Complete "${POC_STAGE_LABELS[p.stage || 0]}" and advance to next phase? Tasks in this stage will be marked completed.`)) return;
    let next = (p.stage || 0) + 1;
    // Skip over any stage the team has marked "not required", mirroring pocAdvance in the legacy app
    while (next < POC_STAGE_LABELS.length - 1 && p.skip?.[next]) next++;
    await patch({ stage: next });
    setStageView(next);
    toast(`Moved to ${POC_STAGE_LABELS[next]}`, 'success');
  };

  const setSkip = async (si, checked) => {
    await patch({ skip: { ...(p.skip || {}), [si]: checked } });
    toast(checked ? `${POC_STAGE_LABELS[si]} marked not required` : `${POC_STAGE_LABELS[si]} re-enabled`, 'success');
  };

  // Hands the POC over to NPD, mirroring promoteToNpd in the original app
  const promote = async () => {
    if (p.promotedTo) return;
    if (!confirm('Promote this POC to a full NPD project?')) return;
    try {
      const npd = await Npds.create({ name: p.name, cust: p.cust, owner: p.owner, devType: 'NPD', fromPoc: p.code });
      await patch({ promotedTo: npd.code });
      toast(`NPD project ${npd.code} created`, 'success');
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  const saveTask = async () => {
    const tasks = [...(p.tasks || [])];
    tasks[taskDlg] = { ...tasks[taskDlg], ...taskVals };
    await patch({ tasks });
    setTaskDlg(null);
    toast('Task updated', 'success');
  };

  if (!p) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const pct = pocPct(p);
  const stageTasks = (p.tasks || []).map((t, gi) => ({ ...t, gi })).filter((t) => t.stage === stageView);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/poc')}><ArrowLeft /></Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            {p.name}
            <Badge variant="outline" className="font-mono">{p.code}</Badge>
            {p.promotedTo && <Badge>→ {p.promotedTo}</Badge>}
          </h1>
          <p className="text-sm text-muted-foreground">
            {p.cust || 'No customer'} · {p.app || '—'} · Owner {p.owner} · Samples by {fmtDate(p.sampleBy)}
          </p>
        </div>
        <div className="flex-1" />
        <div className="w-52">
          <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Overall</span><span>{pct}%</span></div>
          <Progress value={pct} />
        </div>
        {!p.koDone ? (
          <Button onClick={conductKo}><Rocket /> Conduct KO</Button>
        ) : p.promotedTo ? (
          <Badge variant="outline">→ {p.promotedTo}</Badge>
        ) : (p.stage || 0) < POC_STAGE_LABELS.length - 1 ? (
          <Button variant="outline" onClick={advanceStage}>
            {(p.stage || 0) === 0 ? 'Complete KO' : 'Advance to Next Phase'} <ArrowRight />
          </Button>
        ) : (
          <Button onClick={promote}><GitBranch /> Promote to NPD</Button>
        )}
      </div>

      <div className="grid grid-cols-5 gap-3">
        {POC_STAGE_LABELS.map((lbl, si) => {
          const sp = pocStagePct(p, si);
          const active = si === (p.stage || 0);
          return (
            <Card
              key={lbl}
              className={cn('cursor-pointer', stageView === si && 'ring-2 ring-primary', p.skip?.[si] && 'opacity-50')}
              onClick={() => setStageView(si)}
            >
              <CardContent className="p-3 text-center space-y-1.5">
                <div className={cn('text-xs font-semibold', active && 'text-primary')}>{lbl}</div>
                <Progress value={sp} className="h-1.5" />
                <div className="text-[11px] text-muted-foreground">
                  {p.skip?.[si] ? 'skipped' : `${sp}%${active ? ' · current' : ''}`}
                </div>
                {POC_SKIPPABLE[si] && (
                  <label
                    className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className="h-3 w-3"
                      checked={!!p.skip?.[si]}
                      onChange={(e) => setSkip(si, e.target.checked)}
                    />
                    Not required
                  </label>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!p.koDone ? (
        <p className="text-sm text-muted-foreground">No stage plan yet — conduct the kick-off to generate tasks.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">No.</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Responsible</TableHead>
              <TableHead>Plan Start</TableHead>
              <TableHead>Plan End</TableHead>
              <TableHead>%</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stageTasks.map((t) => (
              <TableRow key={t.n} className="cursor-pointer" onClick={() => { setTaskDlg(t.gi); setTaskVals(t); }}>
                <TableCell className="font-mono text-xs">{t.n}</TableCell>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.resp || '—'}</TableCell>
                <TableCell>{fmtDate(t.planStart)}</TableCell>
                <TableCell>{fmtDate(t.planEnd)}</TableCell>
                <TableCell>{t.pct ?? 0}%</TableCell>
                <TableCell><Badge variant="outline" className={badgeForStatus(t.status)}>{t.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={taskDlg != null} onOpenChange={(o) => !o && setTaskDlg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-base">{taskVals.n} · {taskVals.name}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={taskVals.status || 'Not Started'} onValueChange={(v) => setTaskVals({ ...taskVals, status: v, pct: v.startsWith('Completed') ? 100 : taskVals.pct })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_ST.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>% Complete</Label>
              <Input type="number" min={0} max={100} value={taskVals.pct ?? 0} onChange={(e) => setTaskVals({ ...taskVals, pct: Math.min(100, Math.max(0, e.target.valueAsNumber || 0)) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Responsible</Label>
              <Input value={taskVals.resp || ''} onChange={(e) => setTaskVals({ ...taskVals, resp: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Plan Start</Label>
              <Input type="date" value={taskVals.planStart || ''} onChange={(e) => setTaskVals({ ...taskVals, planStart: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Plan End</Label>
              <Input type="date" value={taskVals.planEnd || ''} onChange={(e) => setTaskVals({ ...taskVals, planEnd: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Actual End</Label>
              <Input type="date" value={taskVals.actualEnd || ''} onChange={(e) => setTaskVals({ ...taskVals, actualEnd: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTaskDlg(null)}>Cancel</Button>
            <Button onClick={saveTask}>Save Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
