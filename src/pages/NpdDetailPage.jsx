import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Rocket, CheckCircle2, Circle } from 'lucide-react';
import { Npds } from '@/api/resources';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FormFields from '@/components/crud/FormFields';
import { toast } from '@/components/toaster';
import { GATES, GATE_LABELS, NPD_CATS, BUNITS, TASK_ST, badgeForStatus } from '@/lib/constants';
import {
  buildTaskPlan, recalcChain, seedGateLists, npdGatePct, npdPct, gateIncluded, gateKey, gateApplic, npdHealth,
} from '@/lib/npd';
import { fmtDate, todayIso, cn } from '@/lib/utils';

const CHARTER_FIELDS = [
  ['objective', 'Project Objectives'],
  ['scope', 'Project Scope'],
  ['customerReq', 'Customer Requirements'],
];
const CHARTER_TEAM = [
  ['pm', 'Project Manager'],
  ['electrical', 'Electrical Lead'],
  ['mechanical', 'Mechanical Lead'],
];

const infoFields = [
  { key: 'name', label: 'Project Name', span: 2 },
  { key: 'cust', label: 'Customer' },
  { key: 'businessUnit', label: 'Business Unit', type: 'select', options: BUNITS },
  { key: 'category', label: 'NPD Category', type: 'select', options: NPD_CATS.map((c) => ({ value: c.c, label: `${c.c} — ${c.d}` })) },
  { key: 'customerModel', label: 'Customer Model' },
  { key: 'annualVol', label: 'Annual Volumes' },
  { key: 'owner', label: 'Project Owner' },
  { key: 'startDate', label: 'Start Date', type: 'date' },
  { key: 'launch', label: 'Target Launch', type: 'date' },
];

export default function NpdDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [charter, setCharter] = useState({});
  const [editInfo, setEditInfo] = useState(false);
  const [infoVals, setInfoVals] = useState({});
  const [taskDlg, setTaskDlg] = useState(null); // task being edited (index into tasks)
  const [taskVals, setTaskVals] = useState({});

  useEffect(() => {
    Npds.get(id).then((r) => { setP(r); setCharter(r.charter || {}); }).catch((e) => toast(e.message, 'error'));
  }, [id]);

  const patch = async (body) => {
    try {
      const u = await Npds.update(p.id, body);
      setP(u);
      return u;
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  const charterComplete = useMemo(
    () => CHARTER_FIELDS.every(([k]) => (charter[k] || '').trim()) && CHARTER_TEAM.every(([k]) => (charter[k] || '').trim()),
    [charter]
  );

  // "Conduct KO": generates the full AB-0..AB-7 task plan chained from today
  const conductKo = async () => {
    if (!charterComplete) { toast('Complete the charter first (objectives, scope, requirements & core team)', 'error'); return; }
    const ko = todayIso();
    const tasks = recalcChain(buildTaskPlan(), ko);
    const lists = seedGateLists(p);
    await patch({ koDone: true, koIso: ko, gate: 1, tasks, ...lists });
    toast('Kick-off done — task plan generated', 'success');
  };

  const saveTask = async () => {
    const tasks = [...(p.tasks || [])];
    tasks[taskDlg] = { ...tasks[taskDlg], ...taskVals };
    await patch({ tasks });
    setTaskDlg(null);
    toast('Task updated', 'success');
  };

  const toggleExit = async (gkey, i) => {
    const gateExit = { ...(p.gateExit || {}) };
    gateExit[gkey] = gateExit[gkey].map((e, ix) => (ix === i ? { ...e, met: !e.met } : e));
    await patch({ gateExit });
  };

  const toggleDeliv = async (gkey, i) => {
    const gateDeliv = { ...(p.gateDeliv || {}) };
    gateDeliv[gkey] = gateDeliv[gkey].map((d, ix) => (ix === i ? { ...d, avail: !d.avail } : d));
    await patch({ gateDeliv });
  };

  const setGateOverride = async (gkey, on) => {
    const gateOverride = { ...(p.gateOverride || {}), [gkey]: on ? 'on' : 'off' };
    await patch({ gateOverride });
  };

  if (!p) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const health = npdHealth(p);
  const pct = npdPct(p);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/npd')}><ArrowLeft /></Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            {p.name}
            <Badge variant="outline" className="font-mono">{p.code}</Badge>
            <Badge style={{ background: `${health.color}18`, color: health.color }} variant="outline">{health.status}</Badge>
          </h1>
          <p className="text-sm text-muted-foreground">
            {p.cust || 'No customer'} · {p.businessUnit || '—'} · {p.category || 'No category'} · Owner {p.owner}
          </p>
        </div>
        <div className="flex-1" />
        <div className="w-52">
          <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Overall</span><span>{pct}%</span></div>
          <Progress value={pct} />
        </div>
        <Button variant="outline" onClick={() => { setInfoVals(p); setEditInfo(true); }}>Edit Info</Button>
        {!p.koDone && <Button onClick={conductKo}><Rocket /> Conduct KO</Button>}
      </div>

      <Tabs defaultValue={p.koDone ? 'gates' : 'charter'}>
        <TabsList>
          <TabsTrigger value="charter">Charter</TabsTrigger>
          <TabsTrigger value="gates">Gates</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="exit">Exit Criteria & Deliverables</TabsTrigger>
        </TabsList>

        {/* ── Charter ── */}
        <TabsContent value="charter" className="space-y-3 max-w-3xl">
          {!charterComplete && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              Complete all charter fields to unlock the project kick-off.
            </div>
          )}
          {CHARTER_FIELDS.map(([k, label]) => (
            <div key={k}>
              <Label>{label}</Label>
              <Textarea
                className="mt-1"
                value={charter[k] || ''}
                onChange={(e) => setCharter({ ...charter, [k]: e.target.value })}
              />
            </div>
          ))}
          <div className="grid grid-cols-3 gap-3">
            {CHARTER_TEAM.map(([k, label]) => (
              <div key={k}>
                <Label>{label}</Label>
                <Input className="mt-1" value={charter[k] || ''} onChange={(e) => setCharter({ ...charter, [k]: e.target.value })} />
              </div>
            ))}
          </div>
          <Button onClick={async () => { await patch({ charter }); toast('Charter saved', 'success'); }}>Save Charter</Button>
        </TabsContent>

        {/* ── Gates overview ── */}
        <TabsContent value="gates">
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {GATES.map((G, gi) => {
              const gk = gateKey(G.g);
              const included = gateIncluded(p, gk);
              const applic = gateApplic(p, gk);
              const gpct = npdGatePct(p, gi);
              return (
                <Card key={G.g} className={cn(!included && 'opacity-50')}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>{G.g} — {G.name}</span>
                      {applic === 'C' && (
                        <button
                          className="text-[10px] underline text-muted-foreground"
                          onClick={() => setGateOverride(gk, !included)}
                        >
                          {included ? 'exclude' : 'include'}
                        </button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Progress value={included ? gpct : 0} className="flex-1" />
                      <span className="text-xs font-semibold w-9 text-right">{included ? `${gpct}%` : 'N/A'}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {G.t.length} tasks{applic === 'M' ? ' · mandatory' : applic === 'C' ? ' · conditional' : ' · not applicable'}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {!p.koDone && (
            <p className="text-sm text-muted-foreground mt-4">
              Gate progress starts tracking after the kick-off generates the task plan.
            </p>
          )}
        </TabsContent>

        {/* ── Tasks ── */}
        <TabsContent value="tasks">
          {!p.koDone ? (
            <p className="text-sm text-muted-foreground">No task plan yet — complete the charter, then Conduct KO.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">No.</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Gate</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Plan Start</TableHead>
                  <TableHead>Plan End</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(p.tasks || []).map((t, i) => (
                  <TableRow key={`${t.gi}-${t.n}`} className="cursor-pointer" onClick={() => { setTaskDlg(i); setTaskVals(t); }}>
                    <TableCell className="font-mono text-xs">{t.n}</TableCell>
                    <TableCell className="max-w-md text-[13px]">{t.name}</TableCell>
                    <TableCell><Badge variant="secondary">{GATES[t.gi]?.g}</Badge></TableCell>
                    <TableCell>{t.resp || t.owner || '—'}</TableCell>
                    <TableCell>{fmtDate(t.planStart)}</TableCell>
                    <TableCell>{fmtDate(t.planEnd)}</TableCell>
                    <TableCell>{t.pct ?? 0}%</TableCell>
                    <TableCell><Badge variant="outline" className={badgeForStatus(t.status)}>{t.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* ── Exit criteria & deliverables ── */}
        <TabsContent value="exit" className="space-y-4">
          {!p.koDone ? (
            <p className="text-sm text-muted-foreground">Checklists are seeded at kick-off.</p>
          ) : GATES.map((G) => {
            const gk = gateKey(G.g);
            if (!gateIncluded(p, gk)) return null;
            const exits = p.gateExit?.[gk] || [];
            const delivs = p.gateDeliv?.[gk] || [];
            if (!exits.length && !delivs.length) return null;
            return (
              <Card key={gk}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{G.g} — {G.name}</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Exit Criteria</div>
                    {exits.map((e, i) => (
                      <button key={i} className="flex items-start gap-2 py-1 text-left text-[13px] w-full hover:bg-accent rounded px-1" onClick={() => toggleExit(gk, i)}>
                        {e.met ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />}
                        <span className={cn(e.met && 'line-through text-muted-foreground')}>{e.t}</span>
                      </button>
                    ))}
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Deliverables</div>
                    {delivs.map((d, i) => (
                      <button key={i} className="flex items-start gap-2 py-1 text-left text-[13px] w-full hover:bg-accent rounded px-1" onClick={() => toggleDeliv(gk, i)}>
                        {d.avail ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />}
                        <span className={cn('flex-1', d.avail && 'line-through text-muted-foreground')}>{d.d}</span>
                        {d.fn && <Badge variant="secondary" className="text-[10px]">{d.fn}</Badge>}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Edit project info */}
      <Dialog open={editInfo} onOpenChange={setEditInfo}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Project Info</DialogTitle></DialogHeader>
          <FormFields fields={infoFields} values={infoVals} onChange={setInfoVals} />
          <DialogFooter className="gap-2">
            <Button
              variant="destructive" className="mr-auto"
              onClick={async () => {
                if (!confirm('Delete this NPD project?')) return;
                await Npds.remove(p.id);
                navigate('/npd');
              }}
            >
              Delete
            </Button>
            <Button variant="outline" onClick={() => setEditInfo(false)}>Cancel</Button>
            <Button onClick={async () => { await patch(infoVals); setEditInfo(false); toast('Saved', 'success'); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit task */}
      <Dialog open={taskDlg != null} onOpenChange={(o) => !o && setTaskDlg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">{taskVals.n} · {taskVals.name}</DialogTitle>
          </DialogHeader>
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
              <Label>Owner / Responsible</Label>
              <Input value={taskVals.resp || ''} onChange={(e) => setTaskVals({ ...taskVals, resp: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Plan End</Label>
              <Input type="date" value={taskVals.planEnd || ''} onChange={(e) => setTaskVals({ ...taskVals, planEnd: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Actual Start</Label>
              <Input type="date" value={taskVals.actualStart || ''} onChange={(e) => setTaskVals({ ...taskVals, actualStart: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Actual End</Label>
              <Input type="date" value={taskVals.actualEnd || ''} onChange={(e) => setTaskVals({ ...taskVals, actualEnd: e.target.value })} />
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
    </div>
  );
}
