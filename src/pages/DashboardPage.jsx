import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Rocket, GitBranch, ClipboardCheck, Clock, AlertTriangle, Plus, Calendar, Target, TrendingUp, Wallet, Users as UsersIcon, Box,
} from 'lucide-react';
import {
  Rfqs, Npds, Pocs, MomActions, PpapDocs, Samples, Investments, Users,
} from '@/api/resources';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CollapsibleSection from '@/components/ui/collapsible-section';
import Donut from '@/components/charts/Donut';
import HBarList from '@/components/charts/HBarList';
import PortfolioGantt from '@/components/charts/PortfolioGantt';
import { npdPct, npdHealth, npdGatePct } from '@/lib/npd';
import { pocPct, pocStagePct } from '@/lib/poc';
import { GATE_LABELS, POC_STAGE_LABELS, RFQ_STAGES } from '@/lib/constants';
import { taskBucket, todayIso, lakh } from '@/lib/utils';

const BUCKET_COLOR = {
  done: '#059669', ontrack: '#2563eb', behind: '#d97706', atrisk: '#ea580c', delayed: '#dc2626', ns: '#cbd5e1',
};
const BUCKET_LABEL = {
  done: 'Completed', ontrack: 'On Track', behind: 'Behind Schedule', atrisk: 'At Risk', delayed: 'Delayed', ns: 'Not Started',
};
const SAMPLE_COLOR = {
  New: '#94a3b8', 'In Progress': '#2563eb', 'On Hold': '#d97706', Delayed: '#dc2626',
  'Delayed but Completed': '#ea580c', Submitted: '#7c3aed', Completed: '#059669', Dropped: '#64748b',
};

function Tile({ icon: Icon, color, value, label, caption, to }) {
  const body = (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0" style={{ background: `${color}18`, color }}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold leading-none">{value}</div>
          <div className="text-xs font-medium mt-1">{label}</div>
          {caption && <div className="text-[11px] text-muted-foreground">{caption}</div>}
        </div>
      </CardContent>
    </Card>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

function ChartCard({ icon: Icon, title, cap, to, toLabel = 'View all', children }) {
  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm flex items-center gap-1.5"><Icon className="h-4 w-4 text-muted-foreground" />{title}</CardTitle>
        {to ? (
          <Link to={to} className="text-xs text-primary hover:underline">{toLabel} →</Link>
        ) : cap ? (
          <span className="text-[11px] text-muted-foreground">{cap}</span>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      Rfqs.list(), Npds.list(), Pocs.list(), MomActions.list(), PpapDocs.list(), Samples.list(), Investments.list(), Users.list(),
    ]).then(([rfqs, npds, pocs, actions, ppap, samples, investments, users]) =>
      setData({
        rfqs: rfqs.value || [], npds: npds.value || [], pocs: pocs.value || [],
        actions: actions.value || [], ppap: ppap.value || [], samples: samples.value || [],
        investments: investments.value || [], users: users.value || [],
      })
    );
  }, []);

  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const today = todayIso();
  const activePocs = data.pocs.filter((p) => !p.promotedTo);
  const openRfqs = data.rfqs.filter((r) => !['won', 'lost'].includes(r.stage));
  const won = data.rfqs.filter((r) => r.stage === 'won').length;
  const lost = data.rfqs.filter((r) => r.stage === 'lost').length;
  const winRate = won + lost ? Math.round((won / (won + lost)) * 100) : 0;
  const openActions = data.actions.filter((a) => a.status !== 'Done');
  const overdueActions = openActions.filter((a) => a.due && a.due < today);
  const ppapPending = data.ppap.filter((d) => d.status !== 'Approved').length;
  const samplesOpen = data.samples.filter((s) => !['Completed', 'Dropped'].includes(s.status)).length;
  const invTotal = data.investments.reduce((a, b) => a + (Number(b.investment) || 0), 0);

  const npdHealthList = data.npds.map((p) => npdHealth(p).status);
  const onTrackN = npdHealthList.filter((s) => s === 'On Track').length;

  // Overdue tasks across NPD + POC plans
  const overdueTasks = [];
  data.npds.forEach((p) => (p.tasks || []).forEach((t) => {
    if (taskBucket(t.status, t.pct) !== 'done' && t.planEnd && t.planEnd < today) {
      overdueTasks.push({ proj: p.name, task: `${t.n} · ${t.name}`, owner: t.resp || t.owner, due: t.planEnd });
    }
  }));
  data.pocs.forEach((p) => (p.tasks || []).forEach((t) => {
    if (!p.skip?.[t.stage] && taskBucket(t.status, t.pct) !== 'done' && t.planEnd && t.planEnd < today) {
      overdueTasks.push({ proj: p.name, task: `${t.n} · ${t.name}`, owner: t.resp, due: t.planEnd });
    }
  }));
  overdueTasks.sort((a, b) => (a.due < b.due ? -1 : 1));

  const allPendingTasks = overdueTasks.length + data.npds.reduce((a, p) => a + (p.tasks || []).filter((t) => taskBucket(t.status, t.pct) !== 'done').length, 0)
    + activePocs.reduce((a, p) => a + (p.tasks || []).filter((t) => !p.skip?.[t.stage] && taskBucket(t.status, t.pct) !== 'done').length, 0);

  // Gate / stage distribution
  const gateDist = GATE_LABELS.map((_, i) => data.npds.filter((p) => (p.gate || 0) === i).length);
  const stageDist = POC_STAGE_LABELS.map((_, i) => activePocs.filter((p) => (p.stage || 0) === i).length);
  const maxStage = Math.max(1, ...stageDist);

  // Portfolio task status donut
  const allTasks = [];
  data.npds.forEach((p) => (p.tasks || []).forEach((t) => allTasks.push(t)));
  activePocs.forEach((p) => (p.tasks || []).forEach((t) => { if (!p.skip?.[t.stage]) allTasks.push(t); }));
  const bucketCounts = {};
  allTasks.forEach((t) => { const k = taskBucket(t.status, t.pct); bucketCounts[k] = (bucketCounts[k] || 0) + 1; });
  const taskSegs = Object.keys(BUCKET_LABEL).filter((k) => bucketCounts[k] > 0)
    .map((k) => ({ label: BUCKET_LABEL[k], value: bucketCounts[k], color: BUCKET_COLOR[k] }));

  // RFQ pipeline
  const rfqCounts = RFQ_STAGES.map((s) => data.rfqs.filter((r) => r.stage === s.k).length);

  // Investment by business unit (via each investment's project → NPD business unit)
  const buMap = {};
  data.investments.forEach((iv) => {
    const n = data.npds.find((x) => x.name === iv.proj);
    const bu = (n && n.businessUnit) || iv.proj || 'Other';
    buMap[bu] = (buMap[bu] || 0) + (Number(iv.investment) || 0);
  });
  const buItems = Object.keys(buMap).map((k) => ({ label: k, value: buMap[k], color: '#0f766e' }))
    .sort((a, b) => b.value - a.value).slice(0, 7);

  // Open tasks by department (owner name → user → dept)
  const pendingAll = [...overdueTasks];
  data.npds.forEach((p) => (p.tasks || []).forEach((t) => {
    if (taskBucket(t.status, t.pct) !== 'done') pendingAll.push({ owner: t.resp || t.owner });
  }));
  activePocs.forEach((p) => (p.tasks || []).forEach((t) => {
    if (!p.skip?.[t.stage] && taskBucket(t.status, t.pct) !== 'done') pendingAll.push({ owner: t.resp });
  }));
  const deptMap = {};
  pendingAll.forEach((it) => {
    let d = 'Unassigned';
    if (it.owner) { const u = data.users.find((x) => x.name === it.owner); d = (u && u.dept) || 'Other'; }
    deptMap[d] = (deptMap[d] || 0) + 1;
  });
  const deptItems = Object.keys(deptMap).map((k) => ({ label: k, value: deptMap[k], color: k === 'Unassigned' ? '#94a3b8' : '#7c3aed' }))
    .sort((a, b) => b.value - a.value).slice(0, 8);

  // Sample submissions by status
  const sampleCounts = {};
  data.samples.forEach((s) => { sampleCounts[s.status] = (sampleCounts[s.status] || 0) + 1; });
  const sampleSegs = Object.keys(sampleCounts).map((k) => ({ label: k, value: sampleCounts[k], color: SAMPLE_COLOR[k] || '#64748b' }));

  // Risk & delays — top overdue tasks + NPD projects that are At Risk / Delayed
  const risks = [];
  overdueTasks.slice(0, 4).forEach((t) => risks.push({ name: t.task, detail: `${t.proj} · ${t.owner || 'unassigned'}`, red: true }));
  data.npds.forEach((p) => {
    const h = npdHealth(p);
    if (h.status === 'Delayed' || h.status === 'At Risk') {
      risks.push({ name: p.name, detail: `${p.cust || ''} · ${h.status}`, red: h.status === 'Delayed' });
    }
  });
  const riskRows = risks.slice(0, 7);

  // Portfolio timeline (Gantt) rows
  const ganttRows = [];
  data.npds.forEach((p) => {
    const tasks = (p.tasks || []).filter((t) => t.planStart && t.planEnd);
    const h = npdHealth(p);
    if (!tasks.length) {
      ganttRows.push({ id: `npd-${p.id}`, name: p.name, sub: `${p.cust || ''} · KO pending`, to: `/npd/${p.id}`, start: null, end: null, pct: 0, healthColor: '#64748b', segs: [] });
      return;
    }
    const start = new Date(Math.min(...tasks.map((t) => +new Date(t.planStart))));
    const end = new Date(Math.max(...tasks.map((t) => +new Date(t.planEnd))));
    const byGate = {};
    tasks.forEach((t) => { (byGate[t.gi] ??= []).push(t); });
    const gis = Object.keys(byGate).map(Number).sort((a, b) => a - b);
    const firstOpenGi = gis.find((gi) => npdGatePct(p, gi) < 100);
    const segs = gis.map((gi) => {
      const gt = byGate[gi];
      const gStart = new Date(Math.min(...gt.map((t) => +new Date(t.planStart))));
      const gEnd = new Date(Math.max(...gt.map((t) => +new Date(t.planEnd))));
      const pct = npdGatePct(p, gi);
      let color = '#cbd5e1';
      if (pct >= 100) color = '#059669';
      else if (gEnd < new Date(today) && pct < 100) color = '#dc2626';
      else if (gi === firstOpenGi) color = '#2563eb';
      return { start: gStart, end: gEnd, color, title: `${GATE_LABELS[gi + 1] || ''} · ${pct}%` };
    });
    ganttRows.push({ id: `npd-${p.id}`, name: p.name, sub: `${p.cust || ''} · ${GATE_LABELS[p.gate || 0]}`, to: `/npd/${p.id}`, start, end, pct: npdPct(p), healthColor: h.color, segs });
  });
  activePocs.forEach((p) => {
    const tasks = (p.tasks || []).filter((t) => t.planStart && t.planEnd && !p.skip?.[t.stage]);
    if (!tasks.length) return;
    const start = new Date(Math.min(...tasks.map((t) => +new Date(t.planStart))));
    const end = new Date(Math.max(...tasks.map((t) => +new Date(t.planEnd))));
    const segs = [];
    POC_STAGE_LABELS.forEach((lbl, si) => {
      if (p.skip?.[si]) return;
      const st = tasks.filter((t) => t.stage === si);
      if (!st.length) return;
      const sStart = new Date(Math.min(...st.map((t) => +new Date(t.planStart))));
      const sEnd = new Date(Math.max(...st.map((t) => +new Date(t.planEnd))));
      const pct = pocStagePct(p, si);
      let color = '#cbd5e1';
      if (pct >= 100) color = '#059669';
      else if (si === (p.stage || 0)) color = '#2563eb';
      else if (sEnd < new Date(today) && pct < 100) color = '#dc2626';
      segs.push({ start: sStart, end: sEnd, color, title: `${lbl} · ${pct}%` });
    });
    ganttRows.push({ id: `poc-${p.id}`, name: p.name, sub: `POC · ${POC_STAGE_LABELS[p.stage || 0]}`, to: `/poc/${p.id}`, start, end, pct: pocPct(p), healthColor: '#7c3aed', segs });
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground">One-glance view of the entire portfolio — programs, schedule, risk, pipeline &amp; investment</p>
        </div>
        <div className="flex-1" />
        <Button variant="outline" asChild><Link to="/rfq"><Plus /> New RFQ</Link></Button>
        <Button asChild><Link to="/npd"><Plus /> New Project</Link></Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Tile icon={GitBranch} color="#2563eb" value={data.npds.length} label="NPD Programs" caption={`${onTrackN} on track`} to="/npd" />
        <Tile icon={Rocket} color="#7c3aed" value={activePocs.length} label="Active POCs" caption={`${data.pocs.length} total`} to="/poc" />
        <Tile icon={FileText} color="#0891b2" value={openRfqs.length} label="Open RFQs" caption={`${winRate}% win rate`} to="/rfq" />
        <Tile icon={Clock} color={overdueActions.length ? '#dc2626' : '#d97706'} value={allPendingTasks} label="Pending Tasks" caption={`${overdueActions.length + overdueTasks.length} overdue`} to="/pending" />
        <Tile icon={Box} color="#0f766e" value={samplesOpen} label="Samples Open" caption={`${data.samples.length} total`} to="/samples" />
        <Tile icon={Wallet} color="#0f172a" value={lakh(invTotal)} label="Investment" caption={`${data.investments.length} line items`} to="/investment" />
      </div>

      <CollapsibleSection title="Charts & analytics — timeline, gates, pipeline & risk">
        <ChartCard icon={Calendar} title="Portfolio Timeline — NPD & POC (Gantt)" cap="KO → SOP schedule with gate / stage progress">
          <PortfolioGantt rows={ganttRows} />
        </ChartCard>

        <div className="grid lg:grid-cols-2 gap-4">
          <ChartCard icon={Target} title="NPD Programs by Gate" to="/npd">
            <div className="space-y-1.5">
              {GATE_LABELS.map((g, i) => (
                <div key={g} className="flex items-center gap-2 text-xs">
                  <div className="w-16 shrink-0 text-muted-foreground">{g}</div>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${gateDist[i] ? Math.max((gateDist[i] / Math.max(1, data.npds.length)) * 100, 8) : 0}%` }} />
                  </div>
                  <div className="w-5 text-right font-medium">{gateDist[i]}</div>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard icon={Rocket} title="POCs by Stage" to="/poc">
            <div className="space-y-1.5">
              {POC_STAGE_LABELS.map((g, i) => (
                <div key={g} className="flex items-center gap-2 text-xs">
                  <div className="w-24 shrink-0 text-muted-foreground truncate">{g}</div>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(stageDist[i] / maxStage) * 100}%`, background: i === POC_STAGE_LABELS.length - 1 ? '#059669' : '#7c3aed' }} />
                  </div>
                  <div className="w-5 text-right font-medium">{stageDist[i]}</div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <ChartCard icon={ClipboardCheck} title="Portfolio Task Status">
            <div className="flex items-center gap-6 flex-wrap justify-center">
              <Donut segments={taskSegs} centerLabel="tasks" />
              <div className="space-y-1 text-xs">
                {taskSegs.length ? taskSegs.map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm inline-block" style={{ background: s.color }} />
                    {s.label} <b>{s.value}</b>
                  </div>
                )) : <span className="text-muted-foreground">No tasks yet</span>}
              </div>
            </div>
          </ChartCard>

          <ChartCard icon={TrendingUp} title="RFQ Pipeline" to="/rfq">
            <div className="flex h-2.5 rounded-full overflow-hidden bg-muted mb-3">
              {RFQ_STAGES.map((s, i) => (
                rfqCounts[i] > 0 && (
                  <span key={s.k} style={{ width: `${(rfqCounts[i] / Math.max(1, data.rfqs.length)) * 100}%`, background: s.color }} />
                )
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {RFQ_STAGES.map((s, i) => (
                <div key={s.k} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full inline-block" style={{ background: s.color }} />
                  {s.label}: <b>{rfqCounts[i]}</b>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <ChartCard icon={Wallet} title="Investment by Business Unit" cap={`Total ${lakh(invTotal)}`}>
            <HBarList items={buItems} fmt={lakh} color="#0f766e" />
          </ChartCard>

          <ChartCard icon={UsersIcon} title="Open Tasks by Department" to="/pending">
            <HBarList items={deptItems} color="#7c3aed" />
          </ChartCard>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <ChartCard icon={Box} title="Sample Submissions by Status" to="/samples">
            <div className="flex items-center gap-6 flex-wrap justify-center">
              <Donut segments={sampleSegs} centerLabel="samples" />
              <div className="space-y-1 text-xs">
                {sampleSegs.length ? sampleSegs.map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm inline-block" style={{ background: s.color }} />
                    {s.label} <b>{s.value}</b>
                  </div>
                )) : <span className="text-muted-foreground">No samples yet</span>}
              </div>
            </div>
          </ChartCard>

          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-red-500" />Risk & Delays</CardTitle>
              <Badge variant="outline" className={riskRows.length ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>{riskRows.length}</Badge>
            </CardHeader>
            <CardContent>
              {riskRows.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No risk items 🎉</p>
              ) : (
                <div className="space-y-2">
                  {riskRows.map((r, i) => (
                    <div key={i} className={`text-xs p-2 rounded ${r.red ? 'bg-red-50' : 'bg-amber-50'}`}>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-muted-foreground">{r.detail}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">NPD Portfolio</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.npds.length === 0 && <p className="text-sm text-muted-foreground">No NPD projects yet.</p>}
            {data.npds.map((p) => {
              const h = npdHealth(p);
              const pct = npdPct(p);
              return (
                <Link key={p.id} to={`/npd/${p.id}`} className="block">
                  <div className="flex items-center gap-3">
                    <div className="w-44 truncate text-[13px] font-medium">{p.name}</div>
                    <Badge variant="secondary" className="text-[10px]">{GATE_LABELS[p.gate || 0]}</Badge>
                    <Progress value={pct} className="flex-1" />
                    <span className="text-xs w-9 text-right text-muted-foreground">{pct}%</span>
                    <Badge variant="outline" style={{ color: h.color, borderColor: h.color }} className="text-[10px] w-20 justify-center">
                      {h.status}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">POC Portfolio</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.pocs.length === 0 && <p className="text-sm text-muted-foreground">No POC projects yet.</p>}
            {data.pocs.map((p) => {
              const pct = pocPct(p);
              return (
                <Link key={p.id} to={`/poc/${p.id}`} className="block">
                  <div className="flex items-center gap-3">
                    <div className="w-44 truncate text-[13px] font-medium">{p.name}</div>
                    <Badge variant="secondary" className="text-[10px]">{POC_STAGE_LABELS[p.stage || 0]}</Badge>
                    <Progress value={pct} className="flex-1" />
                    <span className="text-xs w-9 text-right text-muted-foreground">{pct}%</span>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
