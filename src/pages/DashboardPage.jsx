import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Rocket, GitBranch, ClipboardCheck, Clock, AlertTriangle,
} from 'lucide-react';
import { Rfqs, Npds, Pocs, MomActions, PpapDocs, Samples } from '@/api/resources';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { npdPct, npdHealth } from '@/lib/npd';
import { pocPct } from '@/lib/poc';
import { GATE_LABELS, POC_STAGE_LABELS } from '@/lib/constants';
import { taskBucket, todayIso } from '@/lib/utils';

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

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.allSettled([Rfqs.list(), Npds.list(), Pocs.list(), MomActions.list(), PpapDocs.list(), Samples.list()])
      .then(([rfqs, npds, pocs, actions, ppap, samples]) =>
        setData({
          rfqs: rfqs.value || [], npds: npds.value || [], pocs: pocs.value || [],
          actions: actions.value || [], ppap: ppap.value || [], samples: samples.value || [],
        })
      );
  }, []);

  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const today = todayIso();
  const openRfqs = data.rfqs.filter((r) => !['won', 'lost'].includes(r.stage)).length;
  const openActions = data.actions.filter((a) => a.status !== 'Done');
  const overdueActions = openActions.filter((a) => a.due && a.due < today);
  const ppapPending = data.ppap.filter((d) => d.status !== 'Approved').length;

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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Portfolio overview, KPIs & risk</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Tile icon={FileText} color="#2563eb" value={openRfqs} label="Open RFQs" caption={`${data.rfqs.length} total`} to="/rfq" />
        <Tile icon={Rocket} color="#7c3aed" value={data.pocs.filter((p) => !p.promotedTo).length} label="Active POCs" caption={`${data.pocs.length} total`} to="/poc" />
        <Tile icon={GitBranch} color="#d97706" value={data.npds.length} label="NPD Projects" to="/npd" />
        <Tile icon={ClipboardCheck} color="#ca8a04" value={ppapPending} label="PPAP Pending" caption="elements not yet approved" to="/ppap" />
        <Tile icon={Clock} color="#ea580c" value={openActions.length} label="Open Actions" caption={`${overdueActions.length} overdue`} to="/reviews" />
        <Tile icon={AlertTriangle} color="#dc2626" value={overdueTasks.length} label="Overdue Tasks" caption="NPD + POC plans" to="/pending" />
      </div>

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

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Top Risks — overdue work
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueTasks.length === 0 && overdueActions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing overdue 🎉</p>
            ) : (
              <div className="space-y-1.5">
                {overdueTasks.slice(0, 6).map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-[13px]">
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">{t.due}</Badge>
                    <span className="font-medium">{t.proj}</span>
                    <span className="text-muted-foreground truncate">{t.task}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{t.owner || 'unassigned'}</span>
                  </div>
                ))}
                {overdueActions.slice(0, 4).map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-[13px]">
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">{a.due}</Badge>
                    <span className="font-medium">{a.proj || 'Review action'}</span>
                    <span className="text-muted-foreground truncate">{a.text}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{a.owner || 'unassigned'}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
