import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Rocket, ArrowRight, GitBranch, Check,
} from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/toaster';
import { POC_STAGE_LABELS, POC_SKIPPABLE, TASK_ST, badgeForStatus } from '@/lib/constants';
import { buildPocTasks, pocStagePct, pocPct, pocStageUnlocked, recalcPocChain } from '@/lib/poc';
import { cn, fmtDate, todayIso } from '@/lib/utils';
import OverviewTab from './poc/OverviewTab';
import CharterTab from './poc/CharterTab';
import TimelineTab from './poc/TimelineTab';
import PartsTab from './poc/PartsTab';
import GateChecklistPanel, { gatesMissing } from './poc/GateChecklistPanel';
import ReviewsTab from './npd/ReviewsTab';

// Purely presentational gate stepper — one node per POC stage, mirroring the
// legacy app's `.stepper` — done/current/skipped/upcoming states derived from
// data already on the project (p.stage / p.skip), no new logic.
function StageStepper({ stage = 0, skip = {} }) {
  return (
    <div className="relative mt-1 flex items-start justify-between">
      <div className="absolute left-[3%] right-[3%] top-[15px] h-[3px] bg-border" />
      {POC_STAGE_LABELS.map((lbl, i) => {
        const skipped = !!skip[i];
        const done = !skipped && i < stage;
        const cur = i === stage;
        return (
          <div key={lbl} className="relative z-10 flex flex-1 flex-col items-center gap-1.5">
            <div
              className={cn(
                'grid h-[31px] w-[31px] shrink-0 place-items-center rounded-full border-2 text-[11px] font-bold',
                skipped
                  ? 'border-dashed border-border bg-card2 text-muted-foreground'
                  : done
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                    : cur
                      ? 'border-primary bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'border-border bg-card text-muted-foreground'
              )}
            >
              {skipped ? '–' : done ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <div className={cn('text-center text-[10.5px] font-semibold text-muted-foreground', cur && 'text-primary', skipped && 'text-muted-foreground line-through')}>
              {lbl}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PocDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [stageView, setStageView] = useState(0);
  const [taskDlg, setTaskDlg] = useState(null); // global task index
  const [taskVals, setTaskVals] = useState({});
  const [blockOpen, setBlockOpen] = useState(false);
  const [missing, setMissing] = useState([]);
  const [tab, setTab] = useState('charter');

  useEffect(() => {
    Pocs.get(id).then((r) => { setP(r); setStageView(r.stage || 0); setTab(r.koDone ? 'overview' : 'charter'); }).catch((e) => toast(e.message, 'error'));
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
    const ko = todayIso();
    const tasks = recalcPocChain(buildPocTasks(), ko);
    await patch({ koDone: true, koDate: ko, tasks });
    toast('POC kick-off done — stage plan generated', 'success');
  };

  const setKoDate = async (val) => {
    const tasks = recalcPocChain(p.tasks || [], val);
    await patch({ koDate: val, tasks });
  };

  const advanceStage = async () => {
    if ((p.stage || 0) >= POC_STAGE_LABELS.length - 1) return;
    if (!confirm(`Complete "${POC_STAGE_LABELS[p.stage || 0]}" and advance to next phase? Tasks in this stage will be marked completed.`)) return;
    let next = (p.stage || 0) + 1;
    // Skip over any stage the team has marked "not required", mirroring pocAdvance in the legacy app
    while (next < POC_STAGE_LABELS.length - 1 && p.skip?.[next]) next++;
    const tasks = (p.tasks || []).map((t) => (t.stage === (p.stage || 0)
      ? { ...t, status: 'Completed', actualEnd: t.actualEnd || t.planEnd || todayIso() }
      : t));
    await patch({ stage: next, tasks });
    setStageView(next);
    toast(`Moved to ${POC_STAGE_LABELS[next]}`, 'success');
  };

  const setSkip = async (si, checked) => {
    await patch({ skip: { ...(p.skip || {}), [si]: checked } });
    toast(checked ? `${POC_STAGE_LABELS[si]} marked not required` : `${POC_STAGE_LABELS[si]} re-enabled`, 'success');
  };

  // Hands the POC over to NPD, mirroring promoteToNpd in the original app —
  // blocked until every AB0/AB0.5 exit criterion & deliverable is met.
  const promote = async () => {
    if (p.promotedTo) { navigate(`/npd/${p.promotedTo}`); return; }
    const miss = gatesMissing(p);
    if (miss.length) { setMissing(miss); setBlockOpen(true); return; }
    if (!confirm(`Promote "${p.name}" to NPD?\n\nThis creates a NEW NPD project (tooled-up phase) linked to this POC. The NPD project starts fresh at KO.`)) return;
    try {
      const npd = await Npds.create({ name: p.name, cust: p.cust, owner: p.owner, devType: 'NPD', fromPoc: p.code });
      await patch({ promotedTo: npd.code });
      toast(`NPD project ${npd.code} created`, 'success');
      navigate(`/npd/${npd.id}`);
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  const saveTask = async () => {
    let tasks = [...(p.tasks || [])];
    const merged = { ...tasks[taskDlg], ...taskVals };
    if (merged.pct === 100 && !merged.status?.startsWith('Completed')) {
      merged.status = (merged.planEnd && merged.actualEnd && merged.actualEnd > merged.planEnd) ? 'Completed After Delay' : 'Completed';
    } else if (merged.pct > 0 && merged.pct < 100 && merged.status === 'Not Started') {
      merged.status = 'On Track';
    }
    if (merged.actualEnd && !tasks[taskDlg].actualEnd) {
      merged.status = (merged.planEnd && merged.actualEnd > merged.planEnd) ? 'Completed After Delay' : 'Completed';
      merged.pct = 100;
    }
    tasks[taskDlg] = merged;
    tasks = recalcPocChain(tasks, p.koDate);
    await patch({ tasks });
    setTaskDlg(null);
    toast('Task updated', 'success');
  };

  if (!p) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const pct = pocPct(p);
  const stageTasks = (p.tasks || []).map((t, gi) => ({ ...t, gi })).filter((t) => t.stage === stageView);
  const unlocked = pocStageUnlocked(p, stageView);
  const depOptions = (p.tasks || []).map((t) => t.n);

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
          <Button variant="outline" onClick={promote}>→ {p.promotedTo}</Button>
        ) : (p.stage || 0) < POC_STAGE_LABELS.length - 1 ? (
          <Button variant="outline" onClick={advanceStage}>
            {(p.stage || 0) === 0 ? 'Complete KO' : 'Advance to Next Phase'} <ArrowRight />
          </Button>
        ) : (
          <Button onClick={promote}><GitBranch /> Promote to NPD</Button>
        )}
      </div>

      {p.koDone && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold">POC Progress</span>
              <span className="text-[15px] font-bold text-primary">{pct}%</span>
            </div>
            <StageStepper stage={p.stage || 0} skip={p.skip || {}} />
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charter">Charter</TabsTrigger>
          <TabsTrigger value="stages">POC Stages</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="parts">Parts List</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab project={p} /></TabsContent>

        <TabsContent value="charter">
          <CharterTab project={p} onSave={(charter) => patch({ charter })} />
        </TabsContent>

        <TabsContent value="stages" className="space-y-4">
          {p.koDone && (
            <Card>
              <CardContent className="p-4 flex flex-wrap items-center gap-4">
                <div>
                  <div className="text-sm font-semibold">POC KO Date <span className="text-xs font-normal text-muted-foreground">— anchors the whole schedule</span></div>
                  <div className="text-xs text-muted-foreground mt-0.5 max-w-xl">Every activity auto-schedules from it through the dependency chain (default +1 day gap, 2-day duration). Edit any Plan Start / Days / Plan End on a task and the others adjust.</div>
                </div>
                <Input type="date" className="w-44 ml-auto" value={p.koDate || ''} onChange={(e) => setKoDate(e.target.value)} />
              </CardContent>
            </Card>
          )}

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
            <>
              {!unlocked && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
                  🔒 Actual dates are locked until every earlier (non-skipped) stage reaches 100%.
                </p>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">No.</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Responsible</TableHead>
                    <TableHead>Depends On</TableHead>
                    <TableHead>Plan Start</TableHead>
                    <TableHead>Plan End</TableHead>
                    <TableHead>Actual Start</TableHead>
                    <TableHead>Actual End</TableHead>
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
                      <TableCell className="text-muted-foreground">{t.dep || '—'}</TableCell>
                      <TableCell>{fmtDate(t.planStart)}</TableCell>
                      <TableCell>{fmtDate(t.planEnd)}</TableCell>
                      <TableCell>{fmtDate(t.actualStart)}</TableCell>
                      <TableCell>{fmtDate(t.actualEnd)}</TableCell>
                      <TableCell>{t.pct ?? 0}%</TableCell>
                      <TableCell><Badge variant="outline" className={badgeForStatus(t.status)}>{t.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}

          {p.koDone && <GateChecklistPanel project={p} onSave={(fields) => patch(fields)} />}
        </TabsContent>

        <TabsContent value="timeline"><TimelineTab project={p} /></TabsContent>

        <TabsContent value="parts">
          <PartsTab project={p} onSave={(parts) => patch({ parts })} />
        </TabsContent>

        <TabsContent value="reviews"><ReviewsTab project={p} /></TabsContent>
      </Tabs>

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
              <Label>Depends On</Label>
              <Select value={taskVals.dep || '__none__'} onValueChange={(v) => setTaskVals({ ...taskVals, dep: v === '__none__' ? '' : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— none —</SelectItem>
                  {depOptions.filter((n) => n !== taskVals.n).map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Offset (days)</Label>
              <Input type="number" value={taskVals.offset ?? 0} onChange={(e) => setTaskVals({ ...taskVals, offset: e.target.valueAsNumber || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (days)</Label>
              <Input type="number" min={0} value={taskVals.days ?? 2} onChange={(e) => setTaskVals({ ...taskVals, days: Math.max(0, e.target.valueAsNumber || 0) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Plan Start</Label>
              <Input type="date" value={taskVals.planStart || ''} onChange={(e) => setTaskVals({ ...taskVals, planStart: e.target.value, manualStart: !taskVals.dep })} />
            </div>
            <div className="space-y-1.5">
              <Label>Plan End</Label>
              <Input type="date" value={taskVals.planEnd || ''} onChange={(e) => setTaskVals({ ...taskVals, planEnd: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Actual Start</Label>
              <Input type="date" disabled={!unlocked} value={taskVals.actualStart || ''} onChange={(e) => setTaskVals({ ...taskVals, actualStart: e.target.value, status: taskVals.status === 'Not Started' ? 'On Track' : taskVals.status })} />
            </div>
            <div className="space-y-1.5">
              <Label>Actual End</Label>
              <Input type="date" disabled={!unlocked} value={taskVals.actualEnd || ''} onChange={(e) => setTaskVals({ ...taskVals, actualEnd: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Remarks</Label>
              <Textarea value={taskVals.remarks || ''} onChange={(e) => setTaskVals({ ...taskVals, remarks: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTaskDlg(null)}>Cancel</Button>
            <Button onClick={saveTask}>Save Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Not ready to advance</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            The AB0 / AB0.5 gate criteria &amp; deliverables are not yet all met. Mark them complete before promoting.
          </p>
          <ul className="text-sm list-disc pl-5 space-y-1 max-h-64 overflow-auto">
            {missing.map((m, i) => <li key={i}><b>{m.type}:</b> {m.t}</li>)}
          </ul>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBlockOpen(false)}>Close</Button>
            <Button onClick={() => { setBlockOpen(false); setTab('stages'); }}>Go to Gate Checklist</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
